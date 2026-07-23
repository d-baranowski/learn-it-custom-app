package pgmq

import (
	"context"
	"sync"
	"time"

	"pkg/tracing"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// ConsumerConfig tunes a Worker's polling loop. QueueName has no default — it
// is per-service; the wiring provider supplies the fallback.
type ConsumerConfig struct {
	QueueName         string `envconfig:"QUEUE_NAME"`
	PollIntervalMs    int    `envconfig:"POLL_INTERVAL_MS"    default:"2000"`
	BatchSize         int    `envconfig:"BATCH_SIZE"          default:"10"`
	VisibilityTimeout int    `envconfig:"VISIBILITY_TIMEOUT"  default:"30"`
	MaxRetries        int    `envconfig:"MAX_RETRIES"         default:"5"`
}

// Worker polls a pgmq queue and dispatches each message to the Registry.
type Worker struct {
	consumer Consumer
	log      *zap.Logger
	tracer   *tracing.Tracer
	registry *Registry
	cfg      ConsumerConfig

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewWorker(consumer Consumer, registry *Registry, cfg ConsumerConfig, log *zap.Logger) *Worker {
	return &Worker{
		consumer: consumer,
		log:      log.Named("event-consumer"),
		tracer:   tracing.NewTracer("event-consumer"),
		registry: registry,
		cfg:      cfg,
	}
}

// AppendLifecycle wires the worker's Start/Stop to an fx lifecycle.
func AppendLifecycle(lc fx.Lifecycle, w *Worker) {
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			w.Start(ctx)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return w.Stop(ctx)
		},
	})
}

func (w *Worker) Start(ctx context.Context) {
	runCtx, cancel := context.WithCancel(ctx)
	w.cancel = cancel
	w.wg.Add(1)

	go func() {
		defer w.wg.Done()

		interval := time.Duration(w.cfg.PollIntervalMs) * time.Millisecond
		if interval <= 0 {
			interval = 2 * time.Second
		}
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		w.log.Info("event consumer started",
			zap.String("queue", w.cfg.QueueName),
			zap.Duration("poll_interval", interval),
			zap.Int("batch_size", w.cfg.BatchSize),
		)

		for {
			w.processBatch(runCtx)

			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (w *Worker) Stop(ctx context.Context) error {
	if w.cancel != nil {
		w.cancel()
	}

	done := make(chan struct{})
	go func() {
		defer close(done)
		w.wg.Wait()
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-done:
		return nil
	}
}

func (w *Worker) processBatch(ctx context.Context) {
	vt := time.Duration(w.cfg.VisibilityTimeout) * time.Second
	messages, err := w.consumer.Read(ctx, w.cfg.QueueName, w.cfg.BatchSize, vt)
	if err != nil {
		if ctx.Err() == nil {
			w.log.Error("failed to read from queue", zap.Error(err))
		}
		return
	}

	for _, msg := range messages {
		w.processMessage(ctx, msg)
	}
}

func (w *Worker) processMessage(ctx context.Context, msg QueueMessage) {
	ctx, span, log := w.tracer.Start(ctx, "event-consumer.processMessage",
		trace.WithSpanKind(trace.SpanKindConsumer),
	)
	defer span.End()

	routingKey := msg.Message.RoutingKey
	span.SetAttributes(
		attribute.String("event.routing_key", routingKey),
		attribute.Int64("event.msg_id", msg.MsgID),
		attribute.Int("event.read_count", int(msg.ReadCount)),
	)

	handler, ok := w.registry.Get(routingKey)
	if !ok {
		log.Warn("no handler for routing key", zap.String("routing_key", routingKey))
		_ = w.consumer.Ack(ctx, w.cfg.QueueName, msg.MsgID)
		return
	}

	if err := handler(ctx, msg.Message.Payload); err != nil {
		span.RecordError(err)
		log.Error("event handler failed",
			zap.String("routing_key", routingKey),
			zap.Int64("msg_id", msg.MsgID),
			zap.Int32("read_count", msg.ReadCount),
			zap.Error(err),
		)

		if int(msg.ReadCount) >= w.cfg.MaxRetries {
			log.Error("event exceeded max retries, dropping",
				zap.String("routing_key", routingKey),
				zap.Int64("msg_id", msg.MsgID),
			)
			_ = w.consumer.Ack(ctx, w.cfg.QueueName, msg.MsgID)
			return
		}

		retryDelay := backoffDuration(int(msg.ReadCount))
		_ = w.consumer.Nack(ctx, w.cfg.QueueName, msg.MsgID, retryDelay)
		return
	}

	log.Debug("event handled",
		zap.String("routing_key", routingKey),
		zap.Int64("msg_id", msg.MsgID),
	)
	_ = w.consumer.Ack(ctx, w.cfg.QueueName, msg.MsgID)
}

func backoffDuration(attempt int) time.Duration {
	base := 2 * time.Second
	d := base
	for i := 1; i < attempt; i++ {
		d *= 2
		if d > 5*time.Minute {
			return 5 * time.Minute
		}
	}
	return d
}
