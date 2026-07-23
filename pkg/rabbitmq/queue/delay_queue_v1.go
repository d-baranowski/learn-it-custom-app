package queue

import (
	"context"
	"errors"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"github.com/patrickmn/go-cache"
	amqp "github.com/rabbitmq/amqp091-go"
	amqps "github.com/rabbitmq/rabbitmq-stream-go-client/pkg/amqp"
	"github.com/rabbitmq/rabbitmq-stream-go-client/pkg/stream"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"math"
	"pkg/rabbitmq"
	"strconv"
	"sync"
	"time"
)

const (
	HeaderDelay     = "dq-delay"
	HeaderScheduled = "dq-scheduled"
)

type DelayQueueV1 struct {
	id                 string
	config             *DelayQueueConfig
	levels             int
	conn               *rabbitmq.Connection
	env                *stream.Environment
	consumer           *rabbitmq.Consumer
	publisher          *rabbitmq.Publisher
	cancelledConsumer  *stream.Consumer
	cancelledProducer  *stream.Producer
	cancelled          *cache.Cache
	dispatchedConsumer *stream.Consumer
	dispatched         *cache.Cache
	log                *zap.Logger
}

func NewDelayQueueV1(conn *rabbitmq.Connection, env *stream.Environment, config *DelayQueueConfig) (DelayQueue, error) {
	d := &DelayQueueV1{
		id:     ksuid.New().String(),
		config: config,
		conn:   conn,
		env:    env,
		log:    zap.L().Named("rabbitmq-delay-queue-v1"),
	}

	if config == nil {
		return nil, errors.New("delay queue config is required")
	}

	if config.Prefix == "" {
		d.log.Warn("delay queue prefix is not set, defaulting to 'dq'")
	}

	if config.MaxDelay == 0 {
		return nil, errors.New("delay queue max delay is required")
	}

	d.levels = d.requiredLevels(config.MaxDelay)

	var cancelledTtl time.Duration
	if config.CancelledStreamMaxAge != 0 {
		cancelledTtl = time.Second*time.Duration(config.CancelledStreamMaxAge) + time.Minute
	} else {
		cancelledTtl = time.Second*time.Duration(d.MaxDelay()) + time.Minute
	}

	d.cancelled = cache.New(cancelledTtl, cancelledTtl)

	if err := d.env.DeclareStream(config.CancelledStream(),
		stream.NewStreamOptions().SetMaxAge(cancelledTtl)); err != nil {
		d.log.Error("failed to declare cancelled stream", zap.Error(err))
		return nil, err
	}

	cancelledProducerOptions := stream.NewProducerOptions()
	cancelledProducerOptions.SetProducerName(d.id)
	//QueueSize:            defaultQueuePublisherSize,
	//cancelledProducerOptions.SetQueueSize()
	//BatchSize:            defaultBatchSize,
	//cancelledProducerOptions.SetBatchSize()
	//BatchPublishingDelay: defaultBatchPublishingDelay,
	//cancelledProducerOptions.SetBatchPublishingDelay()

	cancelledProducer, err := d.env.NewProducer(config.CancelledStream(), cancelledProducerOptions)
	if err != nil {
		d.log.Error("failed to create cancelled stream producer", zap.Error(err))
		return nil, err
	}
	d.cancelledProducer = cancelledProducer

	// todo: cancelledProducer.NotifyClose() for reconnect, write wrapper for producer

	streamStats, err := d.env.StreamStats(config.CancelledStream())
	if err != nil {
		d.log.Error("failed to get cancelled stream stats", zap.Error(err))
		return nil, err
	}

	// see docs for stream.StreamStats.CommittedChunkId
	// it provides the offset first message in the last committed chunk
	// which is good enough for startup
	lastOffset, _ := streamStats.CommittedChunkId()

	consumerInitialised := false

	var wg sync.WaitGroup
	wg.Add(1)

	if lastOffset < 0 {
		consumerInitialised = true
		wg.Done()
	}

	cancelledConsumerOpts := stream.NewConsumerOptions().
		SetConsumerName(d.id).
		SetOffset(stream.OffsetSpecification{}.First()).
		SetInitialCredits(1000)

	cancelledConsumer, err := d.env.NewConsumer(config.CancelledStream(), func(ctx stream.ConsumerContext, event *amqps.Message) {
		if event.ApplicationProperties == nil {
			d.log.Error("received cancellation event with no application properties")
			return
		}

		idAnnotation, ok := event.ApplicationProperties[HeaderID]
		if !ok {
			d.log.Error("received cancellation event with no id application property")
			return
		}

		id, ok := idAnnotation.(string)
		if !ok {
			d.log.Error("received cancellation event with invalid id application property")
			return
		}

		d.cancelled.Set(id, true, cache.DefaultExpiration)

		if !consumerInitialised && lastOffset >= 0 {
			consumerOffset := ctx.Consumer.GetOffset()
			if consumerOffset >= lastOffset {
				consumerInitialised = true
				wg.Done()
			}
		}
	}, cancelledConsumerOpts)
	if err != nil {
		d.log.Error("failed to create cancellation stream consumer", zap.Error(err))
		return nil, err
	}

	//todo: cancelledConsumer.NotifyClose() for reconnect, write wrapper for consumer

	d.cancelledConsumer = cancelledConsumer

	wg.Wait()

	var dispatchedTtl time.Duration
	if config.DispatchedStreamMaxAge != 0 {
		dispatchedTtl = time.Second*time.Duration(config.DispatchedStreamMaxAge) + time.Minute
	} else {
		dispatchedTtl = time.Second*time.Duration(d.MaxDelay()) + time.Minute
	}

	d.dispatched = cache.New(dispatchedTtl, dispatchedTtl)

	if err = d.env.DeclareStream(d.config.DispatchedStream(),
		stream.NewStreamOptions().SetMaxAge(dispatchedTtl)); err != nil {
		d.log.Error("failed to declare cancellation stream", zap.Error(err))
		return nil, err
	}

	streamStats, err = d.env.StreamStats(config.DispatchedStream())
	if err != nil {
		d.log.Error("failed to get dispatched stream stats", zap.Error(err))
		return nil, err
	}

	lastOffset, _ = streamStats.CommittedChunkId()

	consumerInitialised = false

	wg.Add(1)

	if lastOffset < 0 {
		consumerInitialised = true
		wg.Done()
	}

	dispatchedConsumerOpts := stream.NewConsumerOptions().
		SetConsumerName(d.id).
		SetOffset(stream.OffsetSpecification{}.First()).
		SetInitialCredits(1000)

	dispatchedConsumer, err := d.env.NewConsumer(config.DispatchedStream(), func(ctx stream.ConsumerContext, event *amqps.Message) {
		if event.ApplicationProperties == nil {
			d.log.Error("received cancellation event with no application properties")
			return
		}

		idAnnotation, ok := event.ApplicationProperties[HeaderID]
		if !ok {
			d.log.Error("received cancellation event with no id application property")
			return
		}

		id, ok := idAnnotation.(string)
		if !ok {
			d.log.Error("received cancellation event with invalid id application property")
			return
		}

		d.dispatched.Set(id, true, cache.DefaultExpiration)

		if !consumerInitialised && lastOffset >= 0 {
			consumerOffset := ctx.Consumer.GetOffset()
			if consumerOffset >= lastOffset {
				consumerInitialised = true
				wg.Done()
			}
		}
	}, dispatchedConsumerOpts)
	if err != nil {
		d.log.Error("failed to create cancellation stream consumer", zap.Error(err))
		return nil, err
	}

	//todo: dispatchedConsumer.NotifyClose() for reconnect, write wrapper for consumer

	d.dispatchedConsumer = dispatchedConsumer

	wg.Wait()

	publisher, err := rabbitmq.NewPublisher(conn)
	if err != nil {
		return nil, err
	}
	d.publisher = publisher

	if err = d.Init(); err != nil {
		d.log.Error("failed to initialise delay queue", zap.Error(err))
		return nil, err
	}

	consumer, err := rabbitmq.NewConsumer(
		d.conn,
		func(msg rabbitmq.Delivery) rabbitmq.Action {
			id, ok := msg.Headers[HeaderID]
			if !ok {
				d.log.Error("dispatch consumer received message with no id header")
				return rabbitmq.Ack
			}

			msgID, ok := id.(string)
			if !ok {
				d.log.Error("dispatch consumer received message with invalid id header")
				return rabbitmq.Ack
			}

			if _, found := d.cancelled.Get(msgID); found {
				d.log.Debug("dispatch consumer received message with cancelled id",
					zap.Any("msg", msg))
				return rabbitmq.Ack
			}

			return rabbitmq.NackDiscard
		},
		d.config.DispatcherQueue(),
		rabbitmq.WithConsumerOptionsConcurrency(10),
		rabbitmq.WithConsumerOptionsConsumerName(d.id),
		rabbitmq.WithConsumerOptionsQueueNoDeclare,
		rabbitmq.WithConsumerOptionsQOSPrefetch(10),
	)
	if err != nil {
		zap.L().Error("failed to create dispatch consumer", zap.Error(err))
		return nil, err
	}
	d.consumer = consumer

	return d, nil
}

func (d *DelayQueueV1) MaxDelay() int {
	return int(math.Pow(2, float64(d.levels)))
}

func (d *DelayQueueV1) Init() error {
	if !d.config.Init {
		d.log.Debug("initialisation disabled")
		return nil
	}

	cm := d.conn.Manager()
	_conn := cm.CheckoutConnection()
	defer cm.CheckinConnection()

	ch, err := _conn.Channel()
	if err != nil {
		return err
	}

	parentExchange := ""
	n := d.levels - 1

	d.log.Debug("creating delayed exchange")

	var queueName string
	for n >= 0 {
		exchangeName := d.exchangeName(d.zeroPad(n, 2))

		if err = ch.ExchangeDeclare(exchangeName, rabbitmq.ExchangeTypeHeaders, true, false, false, false, nil); err != nil {
			return err
		}

		if parentExchange != "" {
			d.log.Debug("creating exchange bindings", zap.String("exchange", exchangeName),
				zap.String("parent", parentExchange), zap.String("queue", queueName))
			err = ch.ExchangeBind(exchangeName, "", parentExchange, false, amqp.Table{
				queueName: false,
			})
			if err != nil {
				return err
			}
		}

		queueName = d.queueName(d.zeroPad(n, 2))
		queueDLX := ""
		if n > 0 {
			queueDLX = d.queueName(d.zeroPad(n-1, 2))
		} else {
			queueDLX = d.config.DispatcherExchange()
		}
		queueTTL := int64(math.Pow(2, float64(n))) * 1000

		args := amqp.Table{
			"x-dead-letter-exchange": queueDLX,
			"x-message-ttl":          queueTTL,
			"x-queue-type":           "quorum",
		}

		d.log.Debug("declaring queue", zap.String("queue", queueName), zap.Any("args", args))
		if _, err = ch.QueueDeclare(queueName, true, false, false, false, args); err != nil {
			return err
		}

		d.log.Debug("binding queue", zap.String("queue", queueName), zap.String("exchange", exchangeName))
		if err = ch.QueueBind(queueName, "", exchangeName, false, amqp.Table{queueName: true}); err != nil {
			return err
		}

		n--
		parentExchange = exchangeName
	}

	if err = ch.ExchangeDeclare(d.config.OutputExchange(), rabbitmq.ExchangeTypeTopic, true, false, false,
		false, nil); err != nil {
		return err
	}

	// dispatch exchange / queue
	if err = ch.ExchangeDeclare(d.config.DispatcherExchange(), rabbitmq.ExchangeTypeTopic, true, false, false,
		false, nil); err != nil {
		return err
	}

	if err = ch.ExchangeBind(d.config.DispatcherExchange(), "", parentExchange, false, amqp.Table{queueName: false}); err != nil {
		return err
	}

	args := amqp.Table{
		"x-dead-letter-exchange": d.config.OutputExchange(),
		"x-queue-type":           "quorum",
	}

	d.log.Debug("declaring dispatcher queue", zap.Any("args", args))
	if _, err = ch.QueueDeclare(d.config.DispatcherQueue(), true, false, false, false, args); err != nil {
		return err
	}

	d.log.Debug("binding dispatcher queue")
	if err = ch.QueueBind(d.config.DispatcherQueue(), "*", d.config.DispatcherExchange(), false, nil); err != nil {
		return err
	}

	// dispatched stream
	d.log.Debug("binding dispatched stream to output exchange")
	if err = ch.QueueBind(d.config.DispatchedStream(), "#", d.config.OutputExchange(), false, nil); err != nil {
		return err
	}

	d.log.Debug("declaring input exchange", zap.String("exchange", d.config.InputExchange()))
	if err = ch.ExchangeDeclare(d.config.InputExchange(), rabbitmq.ExchangeTypeHeaders, true, false, false,
		false, nil); err != nil {
		return err
	}

	for i := 0; i < d.levels; i++ {
		queueName = d.queueName(d.zeroPad(i, 2))
		startQueueArg := fmt.Sprintf("%s-%s", d.config.StartQueuePrefix(), d.zeroPad(i, 2))

		if err = ch.QueueBind(queueName, "", d.config.InputExchange(), false, amqp.Table{
			startQueueArg: true,
		}); err != nil {
			return err
		}
	}

	return nil
}

func (d *DelayQueueV1) BindQueue(queueName, key string) error {
	cm := d.conn.Manager()
	_conn := cm.CheckoutConnection()
	defer cm.CheckinConnection()

	ch, err := _conn.Channel()
	if err != nil {
		return err
	}
	err = ch.QueueBind(queueName, key, d.config.OutputExchange(), false, nil)
	if err != nil {
		d.log.Error("failed to bind queue", zap.String("queue", queueName),
			zap.String("key", key), zap.String("exchange", d.config.OutputExchange()), zap.Error(err))
	}
	return err
}

func (d *DelayQueueV1) Cancel(_ context.Context, msgID string) error {
	d.log.Debug("cancelling message", zap.String("msgID", msgID))

	// check if the message has already been dispatched
	if _, found := d.dispatched.Get(msgID); found {
		return ErrAlreadyDispatched
	}

	message := amqps.NewMessage([]byte{})
	message.ApplicationProperties = map[string]interface{}{
		HeaderID: msgID,
	}

	if err := d.cancelledProducer.Send(message); err != nil {
		d.log.Error("failed to publish cancellation", zap.Error(err))
		return err
	}

	if _, found := d.cancelled.Get(msgID); found {
		return nil
	}

	return nil
}

func (d *DelayQueueV1) Enqueue(ctx context.Context,
	msgID string, body interface{}, headers map[string]interface{},
	routingKey string, cancellable bool, delay int) error {

	// check the type of body is bytes otherwise encode it
	var bytes []byte

	_, ok := body.([]byte)
	if !ok {
		var marshalErr error
		bytes, marshalErr = jsoniter.Marshal(body)
		if marshalErr != nil {
			d.log.Error("failed to marshal body", zap.Error(marshalErr))
			return errors.New("failed to marshal body")
		}
	} else {
		bytes = body.([]byte)
	}

	if headers == nil {
		headers = rabbitmq.InjectAMQPHeaders(ctx)
	} else {
		spanHeaders := rabbitmq.InjectAMQPHeaders(ctx)
		for k, v := range spanHeaders {
			headers[k] = v
		}
	}

	delayArgs, err := d.secondsToTableArgs(delay)
	if err != nil {
		return err
	}

	for k, v := range delayArgs {
		headers[k] = v
	}

	headers[HeaderID] = msgID
	headers[HeaderDelay] = delay
	headers[HeaderScheduled] = time.Now().UTC().UnixMilli() + int64(delay*1000)

	d.log.Debug("publishing", zap.String("routingKey", routingKey), zap.Int("delay", delay))

	err = d.publisher.PublishWithContext(
		ctx,
		bytes,
		[]string{routingKey},
		rabbitmq.WithPublishOptionsHeaders(headers),
		rabbitmq.WithPublishOptionsContentType("application/json"),
		rabbitmq.WithPublishOptionsExchange(d.config.InputExchange()))
	if err != nil {
		d.log.Error("failed to publish message", zap.Error(err))
		return err
	}

	return err
}

func (d *DelayQueueV1) convertToBinaryMap(seconds int) map[int]bool {
	binaryString := strconv.FormatInt(int64(seconds), 2)
	segments := make(map[int]bool)

	for i := 0; i < len(binaryString); i++ {
		if binaryString[i] == '1' {
			segments[len(binaryString)-1-i] = true
		} else {
			segments[len(binaryString)-1-i] = false
		}
	}

	return segments
}

func (d *DelayQueueV1) exchangeName(tail string) string {
	if d.config.Prefix == "" {
		return fmt.Sprintf("dq-%s", tail)
	}
	return fmt.Sprintf("%s-dq-%s", d.config.Prefix, tail)
}

func (d *DelayQueueV1) queueName(tail string) string {
	if d.config.Prefix == "" {
		return fmt.Sprintf("dq-%s", tail)
	}
	return fmt.Sprintf("%s-dq-%s", d.config.Prefix, tail)
}

func (d *DelayQueueV1) requiredLevels(seconds int) int {
	return int(math.Ceil(math.Log2(float64(seconds))))
}

func (d *DelayQueueV1) secondsToTableArgs(sec int) (amqp.Table, error) {
	if sec > d.MaxDelay() {
		return nil, errors.New(fmt.Sprintf("max delay is %d, you asked for %d", d.MaxDelay(), sec))
	}
	bits := d.convertToBinaryMap(sec)
	args := amqp.Table{}
	startBit := 0

	for b, v := range bits {
		if v == true {
			args[d.queueName(d.zeroPad(b, 2))] = true
			if b > startBit {
				startBit = b
			}
		} else {
			args[d.queueName(d.zeroPad(b, 2))] = false
		}
	}

	// set the start queue
	args[fmt.Sprintf("%s-%s", d.config.StartQueuePrefix(), d.zeroPad(startBit, 2))] = true

	// delete the queue arg for the start queue
	delete(args, d.queueName(d.zeroPad(startBit, 2)))

	return args, nil
}

func (d *DelayQueueV1) zeroPad(s interface{}, length int) string {
	var str string
	str, ok := s.(string)
	if !ok {
		str = fmt.Sprintf("%d", s)
	}
	for len(str) < length {
		str = "0" + str
	}
	return str
}
