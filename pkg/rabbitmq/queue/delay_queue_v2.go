package queue

import (
	"context"
	"errors"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/ksuid"
	"github.com/uptrace/opentelemetry-go-extra/otelzap"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"math"
	"pkg/rabbitmq"
	"strconv"
	"time"
)

type DelayQueueV2 struct {
	id        string
	config    *DelayQueueConfig
	levels    int
	consumer  *rabbitmq.Consumer
	publisher *rabbitmq.Publisher
	rdb       redis.UniversalClient
	log       *otelzap.Logger
	tracer    trace.Tracer
}

func NewDelayQueueV2(_ context.Context, rdb redis.UniversalClient, config *DelayQueueConfig) (DelayQueue, error) {
	d := &DelayQueueV2{
		id:     ksuid.New().String(),
		config: config,
		rdb:    rdb,
	}

	// no tail provided to get <prefix>-dq
	d.log = otelzap.New(zap.L().Named(d.queueName("")))
	d.tracer = otel.Tracer(d.queueName(""))

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

	publisher, err := rabbitmq.NewCPPublisher()
	if err != nil {
		return nil, err
	}
	d.publisher = publisher

	if err = d.Init(); err != nil {
		d.log.Error("failed to initialise delay queue", zap.Error(err))
		return nil, err
	}

	consumer, err := rabbitmq.NewCPConsumer(
		func(msg rabbitmq.Delivery) rabbitmq.Action {
			ctx, span := d.tracer.Start(rabbitmq.ExtractAMQPHeaders(context.Background(), msg.Headers),
				d.spanName("consume"))
			defer span.End()

			id, ok := msg.Headers[HeaderID]
			if !ok {
				d.log.Ctx(ctx).Error("dispatch consumer received message with no id header")
				return rabbitmq.NackDiscard
			}

			msgID, ok := id.(string)
			if !ok {
				d.log.Ctx(ctx).Error("dispatch consumer received message with invalid id header")
				return rabbitmq.Ack
			}

			span.SetAttributes(
				attribute.String("msgID", msgID),
			)

			// check for cancellable
			cancellable, cancellableExists := msg.Headers[HeaderCancellable]
			if cancellableExists {
				// check the cancellable is a bool
				_, cancellableValid := cancellable.(bool)
				if !cancellableValid {
					d.log.Ctx(ctx).Error("dispatch consumer received message with invalid cancellable header",
						zap.String("msgID", msgID), zap.Any("value", cancellable))
					return rabbitmq.NackRequeue
				}

				if cancellable.(bool) {
					// check redis for message state
					_, err := d.rdb.Get(ctx, d.messageKey(msgID)).Result()
					if err != nil {
						if errors.Is(err, redis.Nil) {
							d.log.Ctx(ctx).Debug("message cancelled, discarding", zap.String("msgID", msgID))
							return rabbitmq.Ack
						}
						d.log.Ctx(ctx).Error("failed to get message state from redis", zap.Error(err))
						return rabbitmq.NackRequeue
					}
				}
			}

			d.log.Debug("dispatching message", zap.String("routingKey", msg.RoutingKey), zap.String("msgID", msgID))

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

func (d *DelayQueueV2) MaxDelay() int {
	return int(math.Pow(2, float64(d.levels)))
}

func (d *DelayQueueV2) Init() error {
	if !d.config.Init {
		d.log.Debug("initialisation disabled")
		return nil
	}

	conn, err := rabbitmq.AcquirePoolConnection()
	if err != nil {
		return err
	}
	defer rabbitmq.ReleasePoolConnection(conn)

	cm := conn.Manager()
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

func (d *DelayQueueV2) BindQueue(queueName, key string) error {
	conn, err := rabbitmq.AcquirePoolConnection()
	if err != nil {
		return err
	}
	defer rabbitmq.ReleasePoolConnection(conn)

	cm := conn.Manager()
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

func (d *DelayQueueV2) Cancel(ctx context.Context, msgID string) error {

	spanCtx, span := d.tracer.Start(ctx, d.spanName("cancel"))
	defer span.End()

	// check if the message has already been dispatched
	_, err := d.rdb.Get(spanCtx, d.messageKey(msgID)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			d.log.Ctx(spanCtx).Debug("message already dispatched", zap.String("msgID", msgID))
			return ErrAlreadyDispatched
		}
		d.log.Error("failed to get message state from redis", zap.Error(err))
		return err
	}

	// delete the message from redis
	deleted, err := d.rdb.Del(spanCtx, d.messageKey(msgID)).Result()
	if err != nil {
		d.log.Ctx(spanCtx).Error("failed to delete message state from redis", zap.Error(err))
		return err
	}

	if deleted == 0 {
		d.log.Ctx(spanCtx).Debug("message already dispatched", zap.String("msgID", msgID))
		return ErrAlreadyDispatched
	}

	d.log.Ctx(spanCtx).Debug("message cancelled", zap.String("msgID", msgID))

	return nil
}

func (d *DelayQueueV2) Enqueue(ctx context.Context,
	msgID string, body interface{}, headers map[string]interface{},
	routingKey string, cancellable bool, delay int) error {

	spanCtx, span := d.tracer.Start(ctx, d.spanName("enqueue"))
	defer span.End()

	if cancellable {
		// set the message state in redis
		_, err := d.rdb.Set(spanCtx, d.messageKey(msgID), true, time.Duration(delay*2)*time.Second).Result()
		if err != nil {
			d.log.Ctx(spanCtx).Error("failed to set message state in redis", zap.Error(err))
			return err
		}
	}

	// check the type of body is bytes otherwise encode it
	var bytes []byte

	_, ok := body.([]byte)
	if !ok {
		var marshalErr error
		bytes, marshalErr = jsoniter.Marshal(body)
		if marshalErr != nil {
			d.log.Ctx(spanCtx).Error("failed to marshal body", zap.Error(marshalErr))
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

	delayArgs, err := d.secondsToTableArgs(delay)
	if err != nil {
		return err
	}

	for k, v := range delayArgs {
		headers[k] = v
	}

	if cancellable {
		headers[HeaderCancellable] = true
	}
	headers[HeaderDelay] = delay
	headers[HeaderID] = msgID
	headers[HeaderScheduled] = time.Now().UTC().UnixMilli() + int64(delay*1000)

	err = d.publisher.PublishWithContext(
		spanCtx,
		bytes,
		[]string{routingKey},
		rabbitmq.WithPublishOptionsHeaders(headers),
		rabbitmq.WithPublishOptionsContentType("application/json"),
		rabbitmq.WithPublishOptionsExchange(d.config.InputExchange()))
	if err != nil {
		d.log.Ctx(spanCtx).Error("failed to publish message", zap.Error(err))
		return err
	}

	d.log.Ctx(spanCtx).Debug("message enqueued", zap.String("msgID", msgID), zap.String("routingKey", routingKey),
		zap.Int("delay", delay))

	return err
}

func (d *DelayQueueV2) EnqueueUnique(ctx context.Context,
	msgID string, body interface{}, headers map[string]interface{},
	routingKey string, cancellable bool, delay int) error {

	spanCtx, span := d.tracer.Start(ctx, d.spanName("enqueue"))
	defer span.End()

	// try and set the key in redis
	set, err := d.rdb.SetNX(spanCtx, d.messageUniqueKey(msgID), true, time.Duration(delay*2)*time.Second).Result()
	if err != nil {
		d.log.Ctx(spanCtx).Error("failed to set message state in redis", zap.Error(err))
		span.RecordError(err)
		return err
	}

	if !set {
		d.log.Ctx(spanCtx).Debug("unique message already exists", zap.String("msgID", msgID))
		return ErrAlreadyDispatched
	}

	if cancellable {
		// set the message state in redis
		_, err := d.rdb.Set(spanCtx, d.messageKey(msgID), true, time.Duration(delay*2)*time.Second).Result()
		if err != nil {
			d.log.Ctx(spanCtx).Error("failed to set message state in redis", zap.Error(err))
			span.RecordError(err)
			return err
		}
	}

	// check the type of body is bytes otherwise encode it
	var bytes []byte

	_, ok := body.([]byte)
	if !ok {
		var marshalErr error
		bytes, marshalErr = jsoniter.Marshal(body)
		if marshalErr != nil {
			d.log.Ctx(spanCtx).Error("failed to marshal body", zap.Error(marshalErr))
			span.RecordError(err)
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

	delayArgs, err := d.secondsToTableArgs(delay)
	if err != nil {
		return err
	}

	for k, v := range delayArgs {
		headers[k] = v
	}

	if cancellable {
		headers[HeaderCancellable] = true
	}
	headers[HeaderDelay] = delay
	headers[HeaderID] = msgID
	headers[HeaderScheduled] = time.Now().UTC().UnixMilli() + int64(delay*1000)

	err = d.publisher.PublishWithContext(
		spanCtx,
		bytes,
		[]string{routingKey},
		rabbitmq.WithPublishOptionsHeaders(headers),
		rabbitmq.WithPublishOptionsContentType("application/json"),
		rabbitmq.WithPublishOptionsExchange(d.config.InputExchange()))
	if err != nil {
		d.log.Ctx(spanCtx).Error("failed to publish message", zap.Error(err))
		return err
	}

	d.log.Ctx(spanCtx).Debug("message enqueued", zap.String("msgID", msgID), zap.String("routingKey", routingKey),
		zap.Int("delay", delay))

	return err
}

func (d *DelayQueueV2) convertToBinaryMap(seconds int) map[int]bool {
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

func (d *DelayQueueV2) exchangeName(tail string) string {
	if d.config.Prefix == "" {
		return fmt.Sprintf("dq-%s", tail)
	}
	return fmt.Sprintf("%s-dq-%s", d.config.Prefix, tail)
}

func (d *DelayQueueV2) messageKey(msgID string) string {
	if d.config.Prefix == "" {
		return fmt.Sprintf("dq:msg:%s", msgID)
	}
	return fmt.Sprintf("%s-dq:msg:%s", d.config.Prefix, msgID)
}

func (d *DelayQueueV2) messageUniqueKey(msgID string) string {
	if d.config.Prefix == "" {
		return fmt.Sprintf("dq:msg:%s:uniq", msgID)
	}
	return fmt.Sprintf("%s-dq:msg:%s:uniq", d.config.Prefix, msgID)
}

func (d *DelayQueueV2) queueName(tail string) string {
	var name string
	if d.config.Prefix == "" {
		name = fmt.Sprintf("dq-%s", tail)
	}
	name = fmt.Sprintf("%s-dq-%s", d.config.Prefix, tail)
	if tail == "" {
		// strip -
		name = name[:len(name)-1]
	}
	return name
}

func (d *DelayQueueV2) requiredLevels(seconds int) int {
	return int(math.Ceil(math.Log2(float64(seconds))))
}

func (d *DelayQueueV2) spanName(op string) string {
	return fmt.Sprintf("%s-dq:%s", d.config.Prefix, op)
}

func (d *DelayQueueV2) secondsToTableArgs(sec int) (amqp.Table, error) {
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

func (d *DelayQueueV2) zeroPad(s interface{}, length int) string {
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
