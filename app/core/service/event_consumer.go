package service

import (
	"pkg/pgmq"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

func PgmqConsumerProvider(db *bun.DB, log *zap.Logger) pgmq.Consumer {
	return pgmq.NewConsumer(db, log)
}

// EventConsumerWorkerProvider wires the shared pgmq consumer worker into the fx
// lifecycle. Queue name falls back to core's queue when config is absent.
func EventConsumerWorkerProvider(lc fx.Lifecycle, consumer pgmq.Consumer, registry *pgmq.Registry, cfg *pgmq.ConsumerConfig, log *zap.Logger) {
	qc := pgmq.ConsumerConfig{
		QueueName:         "core_incoming_events",
		PollIntervalMs:    2000,
		BatchSize:         10,
		VisibilityTimeout: 30,
		MaxRetries:        5,
	}
	if cfg != nil {
		qc = *cfg
		if qc.QueueName == "" {
			qc.QueueName = "core_incoming_events"
		}
	}

	pgmq.AppendLifecycle(lc, pgmq.NewWorker(consumer, registry, qc, log))
}
