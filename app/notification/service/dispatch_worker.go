package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"app/notification/config"
	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/model"
	"pkg/tracing"
	"pkg/util"

	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

const dispatchWorkerActor = "notification-dispatcher"

type NotificationDispatchWorkerProps struct {
	fx.In

	DB          *bun.DB
	Log         *zap.Logger
	DAO         NotificationDAO
	EmailSender EmailSender
	SMSSender   SMSSender
	Config      *config.NotificationDispatchConfig
	QuietHours  *QuietHours `optional:"true"`
}

type dispatchWorker struct {
	db          *bun.DB
	log         *zap.Logger
	tracer      *tracing.Tracer
	dao         NotificationDAO
	emailSender EmailSender
	smsSender   SMSSender
	cfg         *config.NotificationDispatchConfig
	quietHours  *QuietHours

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NotificationDispatchWorkerProvider(lc fx.Lifecycle, props NotificationDispatchWorkerProps) error {
	cfg := props.Config
	if cfg == nil {
		cfg = &config.NotificationDispatchConfig{}
	}

	w := &dispatchWorker{
		db:          props.DB,
		log:         props.Log.Named("notification-dispatch-worker"),
		tracer:      tracing.NewTracer("notification-dispatch-worker"),
		dao:         props.DAO,
		emailSender: props.EmailSender,
		smsSender:   props.SMSSender,
		cfg:         cfg,
		quietHours:  props.QuietHours,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			w.start(ctx)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return w.stop(ctx)
		},
	})

	return nil
}

func (w *dispatchWorker) start(ctx context.Context) {
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

		w.log.Info("notification dispatch worker started",
			zap.Duration("poll_interval", interval),
			zap.Int("max_attempts", w.cfg.MaxAttempts))

		for {
			if err := w.processNext(runCtx); err != nil && err != context.Canceled {
				w.log.Error("failed to process notification dispatch", zap.Error(err))
			}

			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (w *dispatchWorker) stop(ctx context.Context) error {
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

func (w *dispatchWorker) processNext(ctx context.Context) error {
	ctx, span, log := w.tracer.Start(ctx, "dispatchWorker.processNext",
		trace.WithSpanKind(trace.SpanKindInternal))
	defer span.End()

	if w.quietHours != nil && w.quietHours.IsQuiet(time.Now()) {
		span.SetAttributes(attribute.Bool("notification.quiet_hours", true))
		return nil
	}

	return w.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		row, err := w.dao.ClaimPendingTx(ctx, tx)
		if err != nil {
			span.RecordError(err)
			return err
		}
		if row == nil {
			span.SetAttributes(attribute.Bool("notification.found", false))
			return nil
		}

		span.SetAttributes(
			attribute.Bool("notification.found", true),
			attribute.String("notification.id", row.Id),
			attribute.Int("notification.attempt_count", row.AttemptCount),
		)

		providerMessageID, sendErr := w.dispatch(ctx, row)
		if sendErr == nil {
			return w.dao.MarkSentTx(ctx, tx, row.Id, dispatchWorkerActor, providerMessageID)
		}

		attempt := row.AttemptCount + 1
		terminal := w.cfg.MaxAttempts > 0 && attempt >= w.cfg.MaxAttempts
		var nextAttemptAt *int64
		if !terminal {
			delay := backoffMs(w.cfg.BaseDelayMs, w.cfg.MaxDelayMs, attempt)
			t := time.Now().UnixMilli() + int64(delay)
			nextAttemptAt = &t
		}

		log.Warn("notification dispatch failed",
			zap.String("notification_id", row.Id),
			zap.Int("attempt", attempt),
			zap.Bool("terminal", terminal),
			zap.Error(sendErr))

		return w.dao.MarkAttemptFailedTx(ctx, tx, row.Id, dispatchWorkerActor, sendErr, attempt, nextAttemptAt, terminal)
	})
}

func (w *dispatchWorker) dispatch(ctx context.Context, row *model.Notification) (string, error) {
	switch row.DeliveryMechanism {
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL:
		if w.emailSender == nil {
			return "", fmt.Errorf("email sender is not configured")
		}
		return w.emailSender.Send(ctx, EmailMessage{
			ToEmail:        util.Str(row.RecipientEmail),
			Subject:        util.Str(row.Subject),
			Body:           row.Body,
			IdempotencyKey: row.SourceIdempotencyKey,
		})
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS:
		if w.smsSender == nil {
			return "", fmt.Errorf("sms sender is not configured")
		}
		return w.smsSender.Send(ctx, SMSMessage{
			ToPhone:        util.Str(row.RecipientPhone),
			Body:           row.Body,
			IdempotencyKey: row.SourceIdempotencyKey,
		})
	default:
		return "", fmt.Errorf("unsupported delivery mechanism %d", row.DeliveryMechanism)
	}
}

func backoffMs(baseMs, maxMs, attempt int) int {
	if baseMs <= 0 {
		baseMs = 1000
	}
	if maxMs <= 0 {
		maxMs = 300000
	}
	if attempt < 1 {
		attempt = 1
	}

	delay := baseMs
	for i := 1; i < attempt; i++ {
		delay *= 2
		if delay >= maxMs {
			return maxMs
		}
	}
	return delay
}
