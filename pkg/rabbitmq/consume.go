package rabbitmq

import (
	"errors"
	"fmt"
	"go.uber.org/zap"
	"sync"

	amqp "github.com/rabbitmq/amqp091-go"
	"pkg/rabbitmq/internal/channelmanager"
)

// Action is an action that occurs after processed this delivery
type Action int

// Handler defines the handler of each Delivery and return Action
type Handler func(d Delivery) (action Action)

const (
	// Ack default ack this msg after you have successfully processed this delivery.
	Ack Action = iota
	// NackDiscard the message will be dropped or delivered to a server configured dead-letter queue.
	NackDiscard
	// NackRequeue deliver this message to a different consumer.
	NackRequeue
	// Message acknowledgement is left to the user using the msg.Ack() method
	Manual
)

// Consumer allows you to create and connect to queues for data consumption.
type Consumer struct {
	connID                     string
	chanManager                *channelmanager.ChannelManager
	reconnectErrCh             <-chan error
	closeConnectionToManagerCh chan<- struct{}
	options                    ConsumerOptions

	isClosedMux *sync.RWMutex
	isClosed    bool
}

// Delivery captures the fields for a previously delivered message resident in
// a queue to be delivered by the server to a consumer from Channel.Consume or
// Channel.Get.
type Delivery struct {
	amqp.Delivery
}

// NewCPConsumer returns a new Consumer connected to the given rabbitmq server using the connection pool.
func NewCPConsumer(
	handler Handler,
	queue string,
	optionFuncs ...func(*ConsumerOptions),
) (*Consumer, error) {
	conn, err := connectionPool.Acquire()
	if err != nil {
		return nil, fmt.Errorf("can't acquire connection from pool: %w", err)
	}

	return NewConsumer(
		conn,
		handler,
		queue,
		optionFuncs...,
	)
}

// NewConsumer returns a new Consumer connected to the given rabbitmq server
// it also starts consuming on the given connection with automatic reconnection handling
// Do not reuse the returned consumer for anything other than to close it
func NewConsumer(
	conn *Connection,
	handler Handler,
	queue string,
	optionFuncs ...func(*ConsumerOptions),
) (*Consumer, error) {
	defaultOptions := getDefaultConsumerOptions(queue)
	options := &defaultOptions
	for _, optionFunc := range optionFuncs {
		optionFunc(options)
	}

	if conn.connectionManager == nil {
		return nil, errors.New("connection manager can't be nil")
	}

	chanManager, err := channelmanager.NewChannelManager(conn.connectionManager, options.Logger, conn.connectionManager.ReconnectInterval)
	if err != nil {
		return nil, err
	}
	reconnectErrCh, closeCh := chanManager.NotifyReconnect()

	consumer := &Consumer{
		connID:                     conn.id,
		chanManager:                chanManager,
		reconnectErrCh:             reconnectErrCh,
		closeConnectionToManagerCh: closeCh,
		options:                    *options,
		isClosedMux:                &sync.RWMutex{},
		isClosed:                   false,
	}

	err = consumer.startGoroutines(
		handler,
		*options,
	)
	if err != nil {
		return nil, err
	}

	go func() {
		for err := range consumer.reconnectErrCh {
			consumer.options.Logger.Info("successful consumer recovery from error", zap.Error(err))
			err = consumer.startGoroutines(
				handler,
				*options,
			)
			if err != nil {
				consumer.options.Logger.Fatal("error restarting consumer goroutines after cancel or close", zap.Error(err))
				consumer.options.Logger.Fatal("consumer closing, unable to recover")
				return
			}
		}
	}()

	return consumer, nil
}

// Close cleans up resources and closes the consumer.
// It does not close the connection manager, just the subscription
// to the connection manager and the consuming goroutines.
// Only call once.
func (consumer *Consumer) Close() {
	consumer.isClosedMux.Lock()
	defer consumer.isClosedMux.Unlock()
	consumer.isClosed = true
	// close the channel so that rabbitmq server knows that the
	// consumer has been stopped.
	err := consumer.chanManager.Close()
	if err != nil {
		consumer.options.Logger.Warn("error while closing the channel", zap.Error(err))
	}

	consumer.options.Logger.Debug("closing consumer...")
	go func() {
		consumer.closeConnectionToManagerCh <- struct{}{}
	}()

	connectionPool.ReleaseID(consumer.connID)
}

func (consumer *Consumer) IsClosed() bool {
	consumer.isClosedMux.RLock()
	defer consumer.isClosedMux.RUnlock()
	return consumer.isClosed
}

// startGoroutines declares the queue if it doesn't exist,
// binds the queue to the routing key(s), and starts the goroutines
// that will consume from the queue
func (consumer *Consumer) startGoroutines(
	handler Handler,
	options ConsumerOptions,
) error {
	err := consumer.chanManager.QosSafe(
		options.QOSPrefetch,
		0,
		options.QOSGlobal,
	)
	if err != nil {
		return fmt.Errorf("declare qos failed: %w", err)
	}
	err = declareExchange(consumer.chanManager, options.ExchangeOptions)
	if err != nil {
		return fmt.Errorf("declare exchange failed: %w", err)
	}
	err = declareQueue(consumer.chanManager, options.QueueOptions)
	if err != nil {
		return fmt.Errorf("declare queue failed: %w", err)
	}
	err = declareBindings(consumer.chanManager, options)
	if err != nil {
		return fmt.Errorf("declare bindings failed: %w", err)
	}

	msgs, err := consumer.chanManager.ConsumeSafe(
		options.QueueOptions.Name,
		options.RabbitConsumerOptions.Name,
		options.RabbitConsumerOptions.AutoAck,
		options.RabbitConsumerOptions.Exclusive,
		false, // no-local is not supported by RabbitMQ
		options.RabbitConsumerOptions.NoWait,
		tableToAMQPTable(options.RabbitConsumerOptions.Args),
	)
	if err != nil {
		return err
	}

	for i := 0; i < options.Concurrency; i++ {
		go handlerGoroutine(consumer, msgs, options, handler)
	}
	consumer.options.Logger.Debug("Processing messages", zap.Int("goroutines", options.Concurrency))
	return nil
}

func (consumer *Consumer) getIsClosed() bool {
	consumer.isClosedMux.RLock()
	defer consumer.isClosedMux.RUnlock()
	return consumer.isClosed
}

func handlerGoroutine(consumer *Consumer, msgs <-chan amqp.Delivery, consumeOptions ConsumerOptions, handler Handler) {
	for msg := range msgs {
		if consumer.getIsClosed() {
			break
		}

		if consumeOptions.RabbitConsumerOptions.AutoAck {
			handler(Delivery{msg})
			continue
		}

		switch handler(Delivery{msg}) {
		case Ack:
			err := msg.Ack(false)
			if err != nil {
				consumer.options.Logger.Error("can't ack message", zap.Error(err))
			}
		case NackDiscard:
			err := msg.Nack(false, false)
			if err != nil {
				consumer.options.Logger.Error("can't nack message", zap.Error(err))
			}
		case NackRequeue:
			err := msg.Nack(false, true)
			if err != nil {
				consumer.options.Logger.Error("can't nack message", zap.Error(err))
			}
		}
	}
	consumer.options.Logger.Debug("rabbit consumer goroutine closed")
}
