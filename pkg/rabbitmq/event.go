package rabbitmq

const (
	ConsumerCreatedEventRoutingKey = "consumer.created"
	ConsumerDeletedEventRoutingKey = "consumer.deleted"
	QueueCreatedEventRoutingKey    = "queue.created"
	QueueDeletedEventRoutingKey    = "queue.deleted"
	ShovelWorkerStatusRoutingKey   = "shovel.worker.status"
	ShovelWorkerRemovedRoutingKey  = "shovel.worker.removed"
)

type ConsumerCreatedEvent struct {
	AckRequired            bool                   `header:"ack_required"`
	Arguments              map[string]interface{} `header:"arguments"`
	Channel                string                 `header:"channel"`
	ConsumerTag            string                 `header:"consumer_tag"`
	Exclusive              bool                   `header:"exclusive"`
	PrefetchCount          int                    `header:"prefetch_count"`
	Queue                  string                 `header:"queue"`
	TimestampInMs          int64                  `header:"timestamp_in_ms"`
	UserWhoPerformedAction string                 `header:"user_who_performed_action"`
	Vhost                  string                 `header:"vhost"`
}

type ConsumerDeletedEvent struct {
	Channel                string `header:"channel"`
	ConsumerTag            string `header:"consumer_tag"`
	Queue                  string `header:"queue"`
	TimestampInMs          int64  `header:"timestamp_in_ms"`
	UserWhoPerformedAction string `header:"user_who_performed_action"`
	Vhost                  string `header:"vhost"`
}

type QueueCreatedEvent struct {
	Arguments              map[string]interface{} `header:"arguments"` // {<<"x-queue-type">>,longstr,<<"quorum">>}
	AutoDelete             bool                   `header:"auto_delete"`
	Durable                bool                   `header:"durable"`
	Exclusive              bool                   `header:"exclusive"`
	Name                   string                 `header:"name"`
	TimestampInMs          int64                  `header:"timestamp_in_ms"`
	Type                   string                 `header:"type"`
	UserWhoPerformedAction string                 `header:"user_who_performed_action"`
	Vhost                  string                 `header:"vhost"`
}

type QueueDeletedEvent struct {
	Name                   string `header:"name"`
	TimestampInMs          int64  `header:"timestamp_in_ms"`
	Type                   string `header:"type"`
	UserWhoPerformedAction string `header:"user_who_performed_action"`
	Vhost                  string `header:"vhost"`
}
