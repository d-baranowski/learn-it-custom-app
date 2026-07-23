package queue

import (
	"context"
	"errors"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/ksuid"
	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
	"pkg/maps"
	"pkg/rabbitmq"
	"pkg/tracing"
	"pkg/unix"
	"time"
)

type MessageQueueConfig struct {
	Mode            MessageQueueMode
	ExchangeName    string
	ExchangeDeclare bool
	ExchangeDurable bool
	ExchangeKind    string
	QueueName       string
	QueueDeclare    bool
	QueueDurable    bool
	QueueQuorum     bool
	Concurrency     int
	Prefetch        int
	RoutingKeys     []string
	MessageTimeout  time.Duration
	//RDB             redis.UniversalClient
	//RDBConfig       *redis.UniversalOptions
}

type MessageQueue struct {
	config      MessageQueueConfig
	consumer    *rabbitmq.Consumer
	publisher   *rabbitmq.Publisher
	rdb         redis.UniversalClient
	msgChan     chan Message
	subscribers *maps.SafeMap[string, struct{}]
	closing     bool
	closedChan  chan struct{}
	log         *zap.Logger
	tracer      *tracing.Tracer
}

func NewMessageQueue(rdb redis.UniversalClient, config MessageQueueConfig) (*MessageQueue, error) {
	q := &MessageQueue{
		config:      config,
		rdb:         rdb,
		msgChan:     make(chan Message, 1000),
		subscribers: maps.NewSafeMap[string, struct{}](),
		closedChan:  make(chan struct{}),
		log:         zap.L().Named("queue").With(zap.String("name", config.QueueName)),
		tracer:      tracing.NewTracer(fmt.Sprintf("queue:%s", config.QueueName)),
	}

	if q.config.Mode == MessageQueueModeConsume {
		if config.Concurrency == 0 {
			q.log.Warn("concurrency not set, defaulting to 1")
			config.Concurrency = 1
		}

		if config.Prefetch == 0 {
			q.log.Warn("prefetch not set, defaulting to 1")
			config.Prefetch = 1
		}

		if config.MessageTimeout == 0 {
			q.log.Warn("message timeout not set, defaulting to 5s")
			config.MessageTimeout = 5 * time.Second
		}
	}

	if q.config.Mode == MessageQueueModePublish {
		if q.publisher == nil || q.publisher.IsClosed() {
			q.log.Debug("creating publisher")

			publisher, err := rabbitmq.NewCPPublisher()
			if err != nil {
				q.log.Error("failed to create publisher", zap.Error(err))
				return nil, err
			}
			q.publisher = publisher
		} else {
			q.log.Debug("reusing publisher")
		}
	}

	return q, nil
}

func (q *MessageQueue) Cancel(ctx context.Context, msgID string) error {
	spanCtx, span, log := q.tracer.Start(ctx, q.spanName("messageQueue.cancel"))
	defer span.End()

	if q.config.Mode == MessageQueueModeConsume {
		log.Error("cannot cancel message in consume mode", zap.String("msgID", msgID), zap.Error(ErrQueueMode))
		span.RecordError(ErrQueueMode)
		return ErrQueueMode
	}

	// check if the message has already been dispatched
	_, err := q.rdb.Get(spanCtx, q.messageKey(msgID)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			log.Debug("message already dispatched", zap.String("msgID", msgID))
			return ErrAlreadyDispatched
		}
		log.Error("failed to get message state from redis", zap.Error(err))
		span.RecordError(err)
		return err
	}

	// delete the message from redis
	deleted, err := q.rdb.Del(spanCtx, q.messageKey(msgID)).Result()
	if err != nil {
		log.Error("failed to delete message state from redis", zap.Error(err))
		span.RecordError(err)
		return err
	}

	if deleted == 0 {
		log.Debug("message already dispatched", zap.String("msgID", msgID))
		return ErrAlreadyDispatched
	}

	log.Debug("message cancelled", zap.String("msgID", msgID))

	return nil
}

func (q *MessageQueue) Enqueue(ctx context.Context,
	msgID string, body interface{}, headers map[string]interface{}, cancellable bool, expiry int) error {
	spanCtx, span, log := q.tracer.Start(ctx, q.spanName("messageQueue.enqueue"))
	defer span.End()

	log = log.With(zap.String("msgID", msgID))

	if q.config.Mode == MessageQueueModeConsume {
		log.Error("cannot enqueue message in consume mode", zap.Error(ErrQueueMode))
		span.RecordError(ErrQueueMode)
		return ErrQueueMode
	}

	if cancellable {
		// set the message state in redis
		_, err := q.rdb.Set(spanCtx, q.messageKey(msgID), true, time.Duration(expiry+5)*time.Second).Result()
		if err != nil {
			log.Error("failed to set message state in redis", zap.Error(err))
			span.RecordError(err)
			return err
		}
	}

	// check the type of body is bytes otherwise encode it as json
	var bytes []byte

	_, ok := body.([]byte)
	if !ok {
		var marshalErr error
		bytes, marshalErr = jsoniter.Marshal(body)
		if marshalErr != nil {
			log.Error("failed to marshal body", zap.Error(marshalErr))
			span.RecordError(marshalErr)
			return errors.New("failed to marshal body")
		}
	} else {
		bytes = body.([]byte)
	}

	if headers == nil {
		headers = rabbitmq.InjectAMQPHeaders(spanCtx)
	} else {
		spanHeaders := rabbitmq.InjectAMQPHeaders(spanCtx)
		for k, v := range spanHeaders {
			headers[k] = v
		}
	}

	if cancellable {
		headers[HeaderCancellable] = true
	}
	headers[HeaderExpiry] = expiry
	headers[HeaderID] = msgID

	err := q.publisher.PublishWithContext(
		spanCtx,
		bytes,
		[]string{q.config.QueueName},
		rabbitmq.WithPublishOptionsHeaders(headers),
		rabbitmq.WithPublishOptionsContentType("application/json"))
	if err != nil {
		log.Error("failed to publish message", zap.Error(err))
		span.RecordError(err)
		return err
	}

	log.Debug("message enqueued", zap.Bool("cancellable", cancellable), zap.Int("expiry", expiry))

	return err
}

func (q *MessageQueue) Close() {
	q.log.Debug("closing queue")

	if q.publisher != nil && !q.publisher.IsClosed() {
		q.publisher.Close()
	}

	if q.subscribers.Len() == 0 {
		if q.consumer != nil && !q.consumer.IsClosed() {
			q.consumer.Close()
		}

		// notify closed
		close(q.closedChan)
	}
}

func (q *MessageQueue) IsClosed() bool {
	return q.consumer == nil || q.consumer.IsClosed()
}

func (q *MessageQueue) NotifyClosed() <-chan struct{} {
	return q.closedChan
}

func (q *MessageQueue) Subscribe(ctx context.Context, subscriberID string) (chan Message, error) {
	_, span, log := q.tracer.Start(ctx, q.spanName("messageQueue.subscribe"))
	defer span.End()

	if q.config.Mode != MessageQueueModeConsume {
		log.Error("cannot subscribe to queue in publish mode", zap.Error(ErrQueueMode))
		span.RecordError(ErrQueueMode)
		return nil, ErrQueueMode
	}

	if q.consumer == nil || q.consumer.IsClosed() {
		q.log.Debug("creating consumer")

		// generate a unique consumer name in case we're running multiple instances on the same queue
		consumerName := fmt.Sprintf("%s-%s", q.config.QueueName, ksuid.New().String())

		options := []func(*rabbitmq.ConsumerOptions){
			rabbitmq.WithConsumerOptionsConcurrency(q.config.Concurrency),
			rabbitmq.WithConsumerOptionsConsumerName(consumerName),
			rabbitmq.WithConsumerOptionsQOSPrefetch(q.config.Prefetch),
		}

		if q.config.ExchangeName != "" {
			options = append(options, rabbitmq.WithConsumerOptionsExchangeName(q.config.ExchangeName))

			if q.config.ExchangeDeclare {
				options = append(options, rabbitmq.WithConsumerOptionsExchangeDeclare)

				if q.config.ExchangeDurable {
					options = append(options, rabbitmq.WithConsumerOptionsExchangeDurable)
				}

				if q.config.ExchangeKind != "" {
					options = append(options, rabbitmq.WithConsumerOptionsExchangeKind(q.config.ExchangeKind))
				}
			}

			if q.config.RoutingKeys != nil && len(q.config.RoutingKeys) > 0 {
				options = append(options, rabbitmq.WithConsumerOptionsRoutingKeys(q.config.RoutingKeys))
			}
		}

		if q.config.QueueDeclare {
			if q.config.QueueDurable {
				options = append(options, rabbitmq.WithConsumerOptionsQueueDurable)
			}

			if q.config.QueueQuorum {
				options = append(options, rabbitmq.WithConsumerOptionsQueueQuorum)
			}
		} else {
			options = append(options, rabbitmq.WithConsumerOptionsQueueNoDeclare)
		}

		consumer, err := rabbitmq.NewCPConsumer(
			func(msg rabbitmq.Delivery) rabbitmq.Action {
				consumerCtx, cancel := context.WithTimeout(
					rabbitmq.ExtractAMQPHeaders(context.Background(), msg.Headers),
					q.config.MessageTimeout)
				defer cancel()

				consumerSpanCtx, consumerSpan, consumerLog := q.tracer.Start(
					consumerCtx,
					q.spanName("messageQueue.consume"))
				defer consumerSpan.End()

				id, idExists := msg.Headers[HeaderID]
				if !idExists {
					consumerLog.Error("dispatch consumer received message with no id header")
					consumerSpan.RecordError(errors.New("message has no id header"))
					return rabbitmq.NackDiscard
				}

				msgID, idValid := id.(string)
				if !idValid {
					log.Error("dispatch consumer received message with invalid id header", zap.Any("value", id))
					consumerSpan.RecordError(errors.New("message has invalid id header"))
					return rabbitmq.NackDiscard
				}

				consumerSpan.SetAttributes(
					attribute.String("msgID", msgID),
				)

				consumerLog = consumerLog.With(zap.String("msgID", msgID))

				// check for expiry
				expiry, expiryExists := msg.Headers[HeaderExpiry]
				if expiryExists {
					// check the expiry is an int
					_, expiryValid := expiry.(int)
					if !expiryValid {
						consumerLog.Error("dispatch consumer received message with invalid expiry header",
							zap.String("msgID", msgID), zap.Any("value", expiry))
						consumerSpan.RecordError(errors.New("message has invalid expiry header"))
						return rabbitmq.NackDiscard
					}

					if expiry.(int) != 0 {
						consumerSpan.SetAttributes(
							attribute.Int("expiry", expiry.(int)),
						)

						consumerLog = consumerLog.With(zap.Int("expiry", expiry.(int)))

						expiryTimestamp := unix.IntToTimestamp(expiry.(int))
						if expiryTimestamp.Before(unix.Now()) {
							log.Debug("message expired, discarding", zap.String("msgID", msgID))
							return rabbitmq.Ack
						}
					} else {
						log.Error("message expiry set to 0", zap.String("msgID", msgID))
					}
				}

				// check for cancellable
				cancellable, cancellableExists := msg.Headers[HeaderCancellable]
				if cancellableExists {
					// check the cancellable is a bool
					_, cancellableValid := cancellable.(bool)
					if !cancellableValid {
						log.Error("dispatch consumer received message with invalid cancellable header",
							zap.String("msgID", msgID), zap.Any("value", cancellable))
						return rabbitmq.NackRequeue
					}

					if cancellable.(bool) {
						// check redis for message state
						_, err := q.rdb.Get(consumerSpanCtx, q.messageKey(msgID)).Result()
						if err != nil {
							if errors.Is(err, redis.Nil) {
								consumerLog.Debug("message cancelled, discarding", zap.String("msgID", msgID))
								return rabbitmq.Ack
							}
							log.Error("failed to get message state from redis", zap.Error(err))
							return rabbitmq.NackRequeue
						}
					}
				}

				respChan := make(chan MessageResponse)

				select {
				case q.msgChan <- Message{
					Ctx:      consumerSpanCtx,
					Delivery: msg,
					RespChan: respChan,
				}:

				default:
					q.log.Warn("message channel full, requeuing message")
					// todo: check if we need to shutdown the queue if there are no subscribers
					return rabbitmq.NackRequeue
				}

				select {
				case response := <-respChan:
					if response.Err != nil {
						consumerLog.Error("failed to consume message", zap.Error(response.Err))
					}
					return response.Action
				case <-consumerCtx.Done():
					consumerLog.Warn("context timeout while waiting for response")
					return rabbitmq.NackRequeue
				}

			},
			q.config.QueueName,
			options...,
		)
		if err != nil {
			q.log.Error("failed to create consumer", zap.Error(err))
			return nil, err
		}
		q.consumer = consumer
	} else {
		q.log.Debug("reusing consumer")
	}

	q.subscribers.Set(subscriberID, struct{}{})

	return q.msgChan, nil
}

func (q *MessageQueue) Unsubscribe(subscriberID string) {
	q.subscribers.Delete(subscriberID)

	if q.subscribers.Len() == 0 && !q.closing {
		q.closing = true
		//time.AfterFunc(15*time.Second, func() {
		q.Close()
		q.closing = false
		//})
	}
}

func (q *MessageQueue) messageKey(msgID string) string {
	return fmt.Sprintf("%s:msg:%s", q.config.QueueName, msgID)
}

func (q *MessageQueue) spanName(op string) string {
	return fmt.Sprintf("queue:%s:%s", q.config.QueueName, op)
}
