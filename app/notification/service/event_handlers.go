package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	coreevents "app/core/events"
	"app/notification/config"
	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/model"
	notificationevents "app/notification/event_types/notification_events"
	"pkg/pgmq"
	"pkg/unix"

	"go.uber.org/zap"
)

type EventHandlerDeps struct {
	ReminderDAO   ScheduledReminderDAO
	PreferenceDAO PreferenceDAO
	Config        *config.ReminderConfig
}

func RegisterEventHandlers(registry *pgmq.Registry, log *zap.Logger, deps EventHandlerDeps) {
	hlog := log.Named("event-handlers")

	leadTimeMs := int64(86400000)
	if deps.Config != nil && deps.Config.LeadTimeMs > 0 {
		leadTimeMs = int64(deps.Config.LeadTimeMs)
	}

	registry.Register(coreevents.SessionCreated, func(ctx context.Context, payload json.RawMessage) error {
		var p coreevents.SessionEventPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if p.PaidAt != nil || p.CancelledAt != nil {
			hlog.Debug("session already paid or cancelled, skipping reminder",
				zap.String("session_id", p.SessionID))
			return nil
		}

		fireAt, err := computeFireAt(p.Date, p.StartTime, p.Timezone, leadTimeMs)
		if err != nil {
			hlog.Warn("failed to compute fire_at, skipping reminder",
				zap.String("session_id", p.SessionID), zap.Error(err))
			return nil
		}

		reminder := &model.ScheduledReminder{
			EventTypeKey:    notificationevents.SessionUnpaidEventKey,
			EntityID:        p.SessionID,
			EntityType:      "session",
			RecipientUserID: p.TherapistUserID,
			FireAt:          fireAt,
			Status:          model.ReminderStatusPending,
			Payload:         payload,
			CreatedAt:       time.Now().UnixMilli(),
		}

		if err := deps.ReminderDAO.Insert(ctx, reminder); err != nil {
			return fmt.Errorf("insert reminder for session %s: %w", p.SessionID, err)
		}

		hlog.Info("scheduled reminder created",
			zap.String("session_id", p.SessionID),
			zap.Int64("fire_at", fireAt))
		return nil
	})

	registry.Register(coreevents.SessionUpdated, func(ctx context.Context, payload json.RawMessage) error {
		var p coreevents.SessionEventPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if p.CancelledAt != nil || p.PaidAt != nil {
			if err := deps.ReminderDAO.CancelByEntityID(ctx, p.SessionID, notificationevents.SessionUnpaidEventKey); err != nil {
				return fmt.Errorf("cancel reminder for session %s: %w", p.SessionID, err)
			}
			hlog.Info("reminder cancelled (session paid or cancelled)", zap.String("session_id", p.SessionID))
			return nil
		}

		fireAt, err := computeFireAt(p.Date, p.StartTime, p.Timezone, leadTimeMs)
		if err != nil {
			hlog.Warn("failed to compute fire_at on update", zap.String("session_id", p.SessionID), zap.Error(err))
			return nil
		}

		if err := deps.ReminderDAO.UpdateFireAt(ctx, p.SessionID, notificationevents.SessionUnpaidEventKey, fireAt); err != nil {
			return fmt.Errorf("update reminder fire_at for session %s: %w", p.SessionID, err)
		}

		hlog.Debug("reminder fire_at updated", zap.String("session_id", p.SessionID), zap.Int64("fire_at", fireAt))
		return nil
	})

	registry.Register(coreevents.SessionCancelled, func(ctx context.Context, payload json.RawMessage) error {
		var p coreevents.SessionEventPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if err := deps.ReminderDAO.CancelByEntityID(ctx, p.SessionID, notificationevents.SessionUnpaidEventKey); err != nil {
			return fmt.Errorf("cancel reminder for session %s: %w", p.SessionID, err)
		}

		hlog.Info("reminder cancelled (session cancelled)", zap.String("session_id", p.SessionID))
		return nil
	})

	registry.Register(coreevents.SessionPaid, func(ctx context.Context, payload json.RawMessage) error {
		var p coreevents.SessionEventPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if p.SessionID == "" {
			hlog.Warn("session.paid without session_id")
			return nil
		}

		if err := deps.ReminderDAO.CancelByEntityID(ctx, p.SessionID, notificationevents.SessionUnpaidEventKey); err != nil {
			return fmt.Errorf("cancel reminder for session %s: %w", p.SessionID, err)
		}

		hlog.Info("reminder cancelled (session paid)", zap.String("session_id", p.SessionID))
		return nil
	})

	registry.Register(coreevents.TherapistCreated, func(ctx context.Context, payload json.RawMessage) error {
		var p coreevents.TherapistCreatedPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if p.UserID == "" {
			return nil
		}

		pref := &model.Preference{
			UserId:            p.UserID,
			EventTypeKey:      notificationevents.SessionUnpaidEventKey,
			DeliveryMechanism: int(notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL),
			IsEnabled:         true,
			LanguageCode:      "en",
			CreatedAt:         unix.Now(),
			CreatedBy:         "system",
		}

		if err := deps.PreferenceDAO.UpsertPreference(ctx, pref); err != nil {
			return fmt.Errorf("bootstrap preference for therapist %s: %w", p.TherapistID, err)
		}

		hlog.Info("default preference created for new therapist",
			zap.String("therapist_id", p.TherapistID),
			zap.String("user_id", p.UserID))
		return nil
	})
}

func computeFireAt(date, startTime, timezone string, leadTimeMs int64) (int64, error) {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}

	t, err := time.ParseInLocation("2006-01-02 15:04", date+" "+startTime, loc)
	if err != nil {
		t, err = time.ParseInLocation("2006-01-02 15:04:05", date+" "+startTime, loc)
		if err != nil {
			return 0, fmt.Errorf("parse session datetime %q %q: %w", date, startTime, err)
		}
	}

	fireAtMs := t.UnixMilli() - leadTimeMs
	return fireAtMs, nil
}
