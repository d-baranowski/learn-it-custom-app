package queue

import (
	"context"
	"errors"
	rh "github.com/michaelklishin/rabbit-hole/v2"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"net/url"
	"pkg/maps"
	"pkg/rabbitmq"
	"pkg/tracing"
	"pkg/unix"
	"regexp"
)

var (
	ErrQueueNotFound      = errors.New("queue not found")
	ErrQueueStatsNotFound = errors.New("queue stats not found")
)

type MessageQueueManager interface {
	GetQueue(name string) (*MessageQueue, bool)
	GetQueueStatus(name string) (*MessageQueueStatus, bool)

	CancelMessage(ctx context.Context, queueName, msgID string) error
	EnqueueMessage(ctx context.Context, queueName, msgID string, body interface{},
		headers map[string]interface{}, cancellable bool, expiry int) error
}

type messageQueueManager struct {
	id string

	api     *rabbitmq.ApiClient
	pattern string
	args    []string
	vhost   string

	eventConsumer *rabbitmq.Consumer
	rdb           redis.UniversalClient

	queue     *maps.SafeMap[string, *MessageQueue]
	queueInfo *maps.SafeMap[string, rh.QueueInfo]

	log    *zap.Logger
	tracer *tracing.Tracer
}

type MessageQueueManagerProps struct {
	Api *rabbitmq.ApiClient

	RDB redis.UniversalClient

	// Pattern must be empty or a valid regex pattern
	Pattern string

	// Args are the args that must be present on the queue. If empty, no args are checked
	Args []string

	// Vhost is the vhost to use
	Vhost string
}

func NewMessageQueueManager(props MessageQueueManagerProps) (MessageQueueManager, error) {
	m := &messageQueueManager{
		id:        ksuid.New().String(),
		api:       props.Api,
		pattern:   props.Pattern,
		args:      props.Args,
		vhost:     props.Vhost,
		rdb:       props.RDB,
		queue:     maps.NewSafeMap[string, *MessageQueue](),
		queueInfo: maps.NewSafeMap[string, rh.QueueInfo](),
		log:       zap.L().Named("message-queue-manager"),
		tracer:    tracing.NewTracer("message-queue-manager"),
	}

	_, err := regexp.Compile(props.Pattern)
	if err != nil {
		m.log.Error("invalid pattern", zap.Error(err))
		return nil, err
	}

	return m, nil
}

func (m *messageQueueManager) Start(ctx context.Context) error {
	_, span, _ := m.tracer.Start(ctx, "messageQueueManager.Start")
	defer span.End()

	// todo: should be it's own queue with auto-delete after x time

	eventConsumer, err := rabbitmq.NewCPConsumer(
		m.consumeEvents,
		EventQueue,
		rabbitmq.WithConsumerOptionsConcurrency(10),
		rabbitmq.WithConsumerOptionsConsumerName(m.id),
		rabbitmq.WithConsumerOptionsExchangeName(EventExchange),
		rabbitmq.WithConsumerOptionsQueueDurable,
		rabbitmq.WithConsumerOptionsQueueQuorum,
		rabbitmq.WithConsumerOptionsRoutingKeys([]string{
			rabbitmq.ConsumerCreatedEventRoutingKey,
			rabbitmq.ConsumerDeletedEventRoutingKey,
			rabbitmq.QueueCreatedEventRoutingKey,
			rabbitmq.QueueDeletedEventRoutingKey,
			rabbitmq.ShovelWorkerStatusRoutingKey,
			rabbitmq.ShovelWorkerRemovedRoutingKey,
		}),
		rabbitmq.WithConsumerOptionsQOSPrefetch(10),
	)
	if err != nil {
		m.log.Error("failed to create event consumer", zap.Error(err))
		return err
	}

	m.eventConsumer = eventConsumer

	return nil
}

func (m *messageQueueManager) Stop(_ context.Context) error {
	if m.eventConsumer != nil && !m.eventConsumer.IsClosed() {
		m.eventConsumer.Close()
	}

	return nil
}

func (m *messageQueueManager) GetQueue(name string) (*MessageQueue, bool) {
	return m.queue.Get(name)
}

func (m *messageQueueManager) GetQueueStatus(name string) (*MessageQueueStatus, bool) {
	qi, ok := m.queueInfo.Get(name)
	if !ok {
		return nil, false
	}

	mqs := &MessageQueueStatus{
		Consumers: qi.Consumers,
		Length:    qi.Messages,
	}

	if qi.MessageStats != nil {
		mqs.Throughput = int(qi.MessageStats.Ack)
	}

	return mqs, true
}

func (m *messageQueueManager) CancelMessage(ctx context.Context, queueName, msgID string) error {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.CancelMessage")
	defer span.End()

	q, ok := m.queue.Get(queueName)
	if !ok {
		log.Error("queue not found", zap.String("queue", queueName))
		span.RecordError(ErrQueueNotFound)
		return ErrQueueNotFound
	}

	return q.Cancel(ctx, msgID)
}

func (m *messageQueueManager) EnqueueMessage(ctx context.Context, queueName, msgID string, body interface{},
	headers map[string]interface{}, cancellable bool, expiry int) error {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.EnqueueMessage")
	defer span.End()

	q, ok := m.queue.Get(queueName)
	if !ok {
		log.Error("queue not found", zap.String("queue", queueName))
		span.RecordError(ErrQueueNotFound)
		return ErrQueueNotFound
	}

	return q.Enqueue(ctx, msgID, body, headers, cancellable, expiry)
}

func (m *messageQueueManager) consumeEvents(d rabbitmq.Delivery) rabbitmq.Action {
	var queueName string
	var timestampMs int64
	var timestamp unix.Timestamp
	var ok bool
	var queueDeleted bool

	switch d.RoutingKey {
	case rabbitmq.ConsumerCreatedEventRoutingKey:
		if queueName, ok = getHeaderValue[string](d.Headers, "queue"); !ok {
			m.log.Warn("missing queue header")
			return rabbitmq.NackDiscard
		}

		if timestampMs, ok = getHeaderValue[int64](d.Headers, "timestamp_in_ms"); !ok {
			m.log.Warn("missing timestamp_in_ms header")
			return rabbitmq.NackDiscard
		}

		timestamp = unix.Int64ToTimestamp(timestampMs)

	case rabbitmq.ConsumerDeletedEventRoutingKey:
		if queueName, ok = getHeaderValue[string](d.Headers, "queue"); !ok {
			m.log.Warn("missing queue header")
			return rabbitmq.NackDiscard
		}

		if timestampMs, ok = getHeaderValue[int64](d.Headers, "timestamp_in_ms"); !ok {
			m.log.Warn("missing timestamp_in_ms header")
			return rabbitmq.NackDiscard
		}

		timestamp = unix.Int64ToTimestamp(timestampMs)

	case rabbitmq.QueueCreatedEventRoutingKey:
		if queueName, ok = getHeaderValue[string](d.Headers, "name"); !ok {
			m.log.Warn("missing name header")
			return rabbitmq.NackDiscard
		}

		if timestampMs, ok = getHeaderValue[int64](d.Headers, "timestamp_in_ms"); !ok {
			m.log.Warn("missing timestamp_in_ms header")
			return rabbitmq.NackDiscard
		}

		timestamp = unix.Int64ToTimestamp(timestampMs)

	case rabbitmq.QueueDeletedEventRoutingKey:
		if queueName, ok = getHeaderValue[string](d.Headers, "name"); !ok {
			m.log.Warn("missing name header")
			return rabbitmq.NackDiscard
		}

		if timestampMs, ok = getHeaderValue[int64](d.Headers, "timestamp_in_ms"); !ok {
			m.log.Warn("missing timestamp_in_ms header")
			return rabbitmq.NackDiscard
		}

		timestamp = unix.Int64ToTimestamp(timestampMs)

		queueDeleted = true

	case rabbitmq.ShovelWorkerStatusRoutingKey:
		// todo: implement

	case rabbitmq.ShovelWorkerRemovedRoutingKey:
		// todo: implement

	default:
		m.log.Warn("unknown event", zap.String("routing_key", d.RoutingKey))
	}

	m.log.Debug("event received", zap.String("routing_key", d.RoutingKey), zap.String("queue", queueName),
		zap.Time("timestamp", timestamp.Time()))

	// todo: debounce

	if !queueDeleted {

	} else {
		q, qOk := m.queue.Get(queueName)
		if qOk {
			q.Close()
		}

		m.queue.Delete(queueName)
		m.queueInfo.Delete(queueName)
	}

	return rabbitmq.Ack
}

func (m *messageQueueManager) createQueue(ctx context.Context, name string) error {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.createQueue")
	defer span.End()

	if _, ok := m.queue.Get(name); ok {
		return nil
	}

	queueConfig := MessageQueueConfig{
		Mode:            MessageQueueModePublish,
		ExchangeDeclare: false,
		QueueDeclare:    false,
		QueueName:       name,
	}

	mq, mqErr := NewMessageQueue(m.rdb, queueConfig)
	if mqErr != nil {
		log.Error("failed to create message queue", zap.Error(mqErr))
		span.RecordError(mqErr)
		return mqErr
	}

	m.queue.Set(name, mq)

	return nil
}

func (m *messageQueueManager) createShovel(name string, fromQueueName, toQueueName string) error {
	_, err := m.api.DeclareShovel("/", name, rh.ShovelDefinition{
		DestinationURI:                   rh.URISet{"amqp://"},
		SourceURI:                        rh.URISet{"amqp://"},
		AckMode:                          "on-confirm",
		AddForwardHeaders:                true,
		DeleteAfter:                      "",
		DestinationAddForwardHeaders:     false,
		DestinationAddTimestampHeader:    false,
		DestinationAddress:               "",
		DestinationApplicationProperties: nil,
		DestinationExchange:              "",
		DestinationExchangeKey:           "",
		DestinationProperties:            nil,
		DestinationProtocol:              "amqp091",
		DestinationPublishProperties:     nil,
		DestinationQueue:                 toQueueName,
		DestinationQueueArgs:             nil,
		DestinationMessageAnnotations:    nil,
		PrefetchCount:                    0,
		ReconnectDelay:                   0,
		SourceAddress:                    "",
		SourceDeleteAfter:                rh.DeleteAfter("never"),
		SourceExchange:                   "",
		SourceExchangeKey:                "",
		SourcePrefetchCount:              0,
		SourceProtocol:                   "amqp091",
		SourceQueue:                      fromQueueName,
		SourceQueueArgs:                  nil,
		SourceConsumerArgs:               nil,
	})

	return err
}

func (m *messageQueueManager) checkQueueArgs(q rh.QueueInfo) bool {
	for _, arg := range m.args {
		if _, found := q.Arguments[arg]; !found {
			return false
		}
	}
	return true
}

func (m *messageQueueManager) fetchQueue(ctx context.Context, name string) error {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.fetchQueue")
	defer span.End()

	urlValues := url.Values{}
	urlValues.Set("name", name)

	queueInfo, err := m.api.ListQueuesWithParametersIn(m.vhost, urlValues)
	if err != nil {
		log.Error("failed to list queues", zap.Error(err))
		span.RecordError(err)
		return err
	}

	if len(queueInfo) == 0 {
		log.Error("queue not found", zap.String("queue", name))
		span.RecordError(ErrQueueNotFound)
		return ErrQueueNotFound
	}

	qi := queueInfo[0]

	if !m.queue.Has(name) {
		err = m.createQueue(ctx, qi.Name)
		if err != nil {
			log.Error("failed to create message queue", zap.Error(err))
			span.RecordError(err)
			return err
		}
	}

	m.queueInfo.Set(qi.Name, qi)

	return nil
}

func (m *messageQueueManager) fetchQueues(ctx context.Context) error {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.fetchQueues")
	defer span.End()

	urlValues := url.Values{}
	if m.pattern != "" {
		urlValues.Add("name", m.pattern)
		urlValues.Add("use_regex", "true")
	}

	queueInfo, err := m.api.ListQueuesWithParametersIn(m.vhost, urlValues)
	if err != nil {
		log.Error("failed to list queues", zap.Error(err))
		span.RecordError(err)
		return err
	}

	for _, qi := range queueInfo {
		if len(m.args) > 0 {
			if !m.checkQueueArgs(qi) {
				continue
			}
		}

		err = m.createQueue(ctx, qi.Name)
		if err != nil {
			span.RecordError(err)
			log.Error("failed to create message queue", zap.Error(err))
			return err
		}

		m.queueInfo.Set(qi.Name, qi)
	}

	return nil
}

func (m *messageQueueManager) fetchShovels(ctx context.Context) ([]rh.ShovelInfo, error) {
	_, span, log := m.tracer.Start(ctx, "messageQueueManager.fetchShovels")
	defer span.End()

	shovels, err := m.api.ListShovels()
	if err != nil {
		log.Error("failed to list shovels", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	return shovels, nil
}

func (m *messageQueueManager) getQueueConsumers(name string) (int, error) {
	qi, ok := m.queueInfo.Get(name)
	if !ok {
		return 0, ErrQueueNotFound
	}

	return qi.Consumers, nil
}

func (m *messageQueueManager) getQueueLength(name string) (int, error) {
	qi, ok := m.queueInfo.Get(name)
	if !ok {
		return 0, ErrQueueNotFound
	}

	return qi.Messages, nil
}

func (m *messageQueueManager) getQueueThroughput(name string) (int, error) {
	qi, ok := m.queueInfo.Get(name)
	if !ok {
		return 0, ErrQueueNotFound
	}

	if qi.MessageStats == nil {
		return 0, ErrQueueStatsNotFound
	}

	return int(qi.MessageStats.Ack), nil
}
