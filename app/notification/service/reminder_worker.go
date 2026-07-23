package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"app/notification/config"
	corev1connect "app/core/gen/core/v1/corev1connect"
	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/event_types"
	notificationevents "app/notification/event_types/notification_events"
	"app/notification/model"
	"pkg/tracing"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
	requestv1 "pkg/request/gen/request/v1"
)

const digestWindowMs = 3600000 // 1 hour

type ReminderWorkerProps struct {
	fx.In

	DB               *bun.DB
	Log              *zap.Logger
	ReminderDAO      ScheduledReminderDAO
	NotificationDAO  NotificationDAO
	TemplateRenderer *TemplateRenderer
	PreferenceDAO    PreferenceDAO
	SessionClient    corev1connect.SessionServiceClient `optional:"true"`
	Config           *config.ReminderConfig             `optional:"true"`
}

type reminderWorker struct {
	db               *bun.DB
	log              *zap.Logger
	tracer           *tracing.Tracer
	reminderDAO      ScheduledReminderDAO
	notificationDAO  NotificationDAO
	templateRenderer *TemplateRenderer
	preferenceDAO    PreferenceDAO
	sessionClient    corev1connect.SessionServiceClient
	cfg              *config.ReminderConfig

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func ReminderWorkerProvider(lc fx.Lifecycle, props ReminderWorkerProps) {
	cfg := props.Config
	if cfg == nil {
		cfg = &config.ReminderConfig{
			PollIntervalMs: 30000,
			LeadTimeMs:     86400000,
			BatchSize:      10,
		}
	}

	w := &reminderWorker{
		db:               props.DB,
		log:              props.Log.Named("reminder-worker"),
		tracer:           tracing.NewTracer("reminder-worker"),
		reminderDAO:      props.ReminderDAO,
		notificationDAO:  props.NotificationDAO,
		templateRenderer: props.TemplateRenderer,
		preferenceDAO:    props.PreferenceDAO,
		sessionClient:    props.SessionClient,
		cfg:              cfg,
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
}

func (w *reminderWorker) start(ctx context.Context) {
	runCtx, cancel := context.WithCancel(ctx)
	w.cancel = cancel
	w.wg.Add(1)

	go func() {
		defer w.wg.Done()

		interval := time.Duration(w.cfg.PollIntervalMs) * time.Millisecond
		if interval <= 0 {
			interval = 30 * time.Second
		}
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		w.log.Info("reminder worker started",
			zap.Duration("poll_interval", interval),
			zap.Int("batch_size", w.cfg.BatchSize),
		)

		for {
			if err := w.processBatch(runCtx); err != nil && err != context.Canceled {
				w.log.Error("failed to process reminders", zap.Error(err))
			}

			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (w *reminderWorker) stop(ctx context.Context) error {
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

func (w *reminderWorker) processBatch(ctx context.Context) error {
	return w.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		grouped, err := w.reminderDAO.ClaimDueGrouped(ctx, tx, digestWindowMs)
		if err != nil {
			return err
		}

		for recipientUserID, reminders := range grouped {
			w.processDigest(ctx, tx, recipientUserID, reminders)
		}
		return nil
	})
}

func (w *reminderWorker) processDigest(ctx context.Context, tx bun.Tx, recipientUserID string, reminders []*model.ScheduledReminder) {
	ctx, span, log := w.tracer.Start(ctx, "reminder-worker.processDigest",
		trace.WithSpanKind(trace.SpanKindInternal),
	)
	defer span.End()

	span.SetAttributes(
		attribute.String("recipient_user_id", recipientUserID),
		attribute.Int("reminder_count", len(reminders)),
	)

	var sessions []notificationevents.SessionUnpaidSessionDetail
	var reminderIDs []string
	var therapistLabel string
	var eventTypeKey string

	for _, reminder := range reminders {
		reminderIDs = append(reminderIDs, reminder.Id)
		eventTypeKey = reminder.EventTypeKey

		if w.sessionClient == nil {
			continue
		}

		sessionResp, err := w.sessionClient.Get(ctx, connect.NewRequest(&requestv1.GetRequest{ID: reminder.EntityID}))
		if err != nil {
			log.Warn("session fetch failed, skipping",
				zap.String("reminder_id", reminder.Id),
				zap.String("session_id", reminder.EntityID),
				zap.Error(err))
			continue
		}

		msg := sessionResp.Msg
		if msg.PaidAt != nil || msg.CancelledAt != nil || msg.DeletedAt != nil {
			log.Info("session no longer unpaid, cancelling reminder",
				zap.String("session_id", reminder.EntityID))
			_ = w.reminderDAO.CancelByEntityID(ctx, reminder.EntityID, reminder.EventTypeKey)
			continue
		}

		if therapistLabel == "" && msg.TherapistLabel != nil {
			therapistLabel = *msg.TherapistLabel
		}

		detail := notificationevents.SessionUnpaidSessionDetail{
			ID:        msg.Id,
			Date:      msg.Date,
			StartAt:   msg.StartTime,
			AmountDue: msg.Price,
			Currency:  "PLN",
		}

		if msg.CustomerLabels != nil && *msg.CustomerLabels != "" {
			for _, name := range strings.Split(*msg.CustomerLabels, ", ") {
				detail.Customers = append(detail.Customers, notificationevents.SessionUnpaidCustomerPayload{
					FullName: strings.TrimSpace(name),
				})
			}
		}

		if msg.PaymentLink != nil && *msg.PaymentLink != "" {
			detail.Payment = &notificationevents.SessionUnpaidPaymentPayload{
				Link: *msg.PaymentLink,
			}
		}

		sessions = append(sessions, detail)
	}

	if len(sessions) == 0 {
		log.Debug("no unpaid sessions remain after verification, all reminders cancelled")
		return
	}

	payload := notificationevents.SessionUnpaidPayload{
		Sessions: sessions,
		Therapist: &notificationevents.SessionUnpaidTherapistPayload{
			FullName: therapistLabel,
		},
	}

	payloadMap, err := event_types.PayloadToMap(payload)
	if err != nil {
		log.Error("failed to convert payload to map", zap.Error(err))
		return
	}

	preferences, err := w.preferenceDAO.ListEnabledForUser(ctx, recipientUserID, eventTypeKey)
	if err != nil {
		log.Error("failed to load preferences", zap.String("user_id", recipientUserID), zap.Error(err))
		return
	}

	if len(preferences) == 0 {
		log.Debug("no enabled preferences, marking fired", zap.String("user_id", recipientUserID))
		if err := w.reminderDAO.MarkFiredBatch(ctx, tx, reminderIDs); err != nil {
			log.Error("failed to mark reminders as fired", zap.Error(err))
		}
		return
	}

	for _, pref := range preferences {
		rendered, err := w.templateRenderer.Render(ctx, eventTypeKey, pref.LanguageCode, pref.DeliveryMechanism, payloadMap)
		if err != nil {
			log.Warn("failed to render template",
				zap.String("language", pref.LanguageCode),
				zap.Int("mechanism", pref.DeliveryMechanism),
				zap.Error(err),
			)
			continue
		}

		idempotencyKey := fmt.Sprintf("digest:%s:%s:%d:%s", eventTypeKey, recipientUserID, pref.DeliveryMechanism, strconv.FormatInt(time.Now().UnixMilli()/digestWindowMs, 10))
		upsert := NotificationUpsertModel{
			RecipientUserID: &pref.UserId,
			RecipientLabel:  pref.UserLabel,
			RecipientEmail:  pref.UserEmail,
			RecipientPhone:  pref.UserPhone,
			Body:            rendered.Body,
			Mechanism:       notificationv1.NotificationDeliveryMechanism(pref.DeliveryMechanism),
			IdempotencyKey:  &idempotencyKey,
			RequestedBy:     "reminder-worker",
			EventTypeKey:    &eventTypeKey,
			TemplateID:      &rendered.TemplateID,
		}

		if rendered.Subject != "" {
			upsert.Subject = &rendered.Subject
		}

		if _, _, err := w.notificationDAO.UpsertNotification(ctx, upsert); err != nil {
			log.Error("failed to create digest notification",
				zap.String("user_id", pref.UserId),
				zap.Error(err),
			)
			continue
		}
	}

	if err := w.reminderDAO.MarkFiredBatch(ctx, tx, reminderIDs); err != nil {
		log.Error("failed to mark reminders as fired", zap.Error(err))
		return
	}
	log.Info("digest reminder fired",
		zap.String("recipient_user_id", recipientUserID),
		zap.Int("sessions_count", len(sessions)),
		zap.Int("reminders_fired", len(reminderIDs)),
		zap.Int("notifications_created", len(preferences)),
	)
}
