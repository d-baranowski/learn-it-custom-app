package service

import (
	"pkg/pgmq"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

// EventConsumerWorkerProvider wires the shared pgmq consumer worker into the fx
// lifecycle. The queue name falls back to the notification queue when config is
// absent; the poll/batch/retry defaults come from pgmq.ConsumerConfig.
func EventConsumerWorkerProvider(lc fx.Lifecycle, consumer pgmq.Consumer, registry *pgmq.Registry, cfg *pgmq.ConsumerConfig, log *zap.Logger) {
	qc := pgmq.ConsumerConfig{
		QueueName:         "notification_incoming_events",
		PollIntervalMs:    2000,
		BatchSize:         10,
		VisibilityTimeout: 30,
		MaxRetries:        5,
	}
	if cfg != nil {
		qc = *cfg
		if qc.QueueName == "" {
			qc.QueueName = "notification_incoming_events"
		}
	}

	pgmq.AppendLifecycle(lc, pgmq.NewWorker(consumer, registry, qc, log))
}
