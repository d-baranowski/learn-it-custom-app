package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/model"
	"pkg/str"
	"pkg/unix"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
)

type NotificationDAO interface {
	UpsertNotification(ctx context.Context, in NotificationUpsertModel) (*model.Notification, bool, error)
	ClaimPendingTx(ctx context.Context, tx bun.Tx) (*model.Notification, error)
	MarkSentTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy, providerMessageID string) error
	MarkAttemptFailedTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy string, sendErr error, attemptCount int, nextAttemptAt *int64, terminal bool) error
	ApplyDeliveryStatusTx(ctx context.Context, tx bun.Tx, actor, providerMessageID string, status notificationv1.NotificationDeliveryStatus, failureReason *string, eventAt int64) (bool, error)
}

type bunNotificationDAO struct {
	db          *bun.DB
	quietHours  *QuietHours
}

func NewNotificationDAO(db *bun.DB, quietHours *QuietHours) NotificationDAO {
	return &bunNotificationDAO{db: db, quietHours: quietHours}
}

func (d *bunNotificationDAO) UpsertNotification(ctx context.Context, in NotificationUpsertModel) (*model.Notification, bool, error) {
	key := str.TrimPtrToNil(in.IdempotencyKey)

	if key != nil {
		var existing model.Notification
		query := d.db.NewSelect().
			Model(&existing).
			Where("source_idempotency_key = ?", *key).
			Where("delivery_mechanism = ?", in.Mechanism).
			Where("deleted_at IS NULL")
		if normalizedRecipientID := str.TrimPtrToNil(in.RecipientUserID); normalizedRecipientID != nil {
			query = query.Where("recipient_user_id = ?", *normalizedRecipientID)
		} else {
			query = query.Where("recipient_user_id IS NULL")
			query = applyNullableRecipientFilter(query, "recipient_email", str.TrimPtrToNil(in.RecipientEmail))
			query = applyNullableRecipientFilter(query, "recipient_phone", str.TrimPtrToNil(in.RecipientPhone))
		}
		err := query.Limit(1).Scan(ctx)
		if err == nil {
			existing.Subject = str.TrimPtrToNil(in.Subject)
			existing.Body = in.Body
			existing.RecipientLabel = in.RecipientLabel
			existing.RecipientEmail = str.TrimPtrToNil(in.RecipientEmail)
			existing.UpdatedAt = &[]unix.Timestamp{unix.Now()}[0]
			_, _ = d.db.NewUpdate().Model(&existing).
				Column("subject", "body", "recipient_label", "recipient_email", "updated_at").
				Where("id = ?", existing.Id).
				Exec(ctx)
			return &existing, true, nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return nil, false, connect.NewError(connect.CodeInternal, err)
		}
	}

	status, nextAttempt, scheduled := d.scheduleState(in.ScheduledAt)

	row := &model.Notification{
		RecipientUserId:      str.TrimPtrToNil(in.RecipientUserID),
		RecipientLabel:       in.RecipientLabel,
		RecipientEmail:       str.TrimPtrToNil(in.RecipientEmail),
		RecipientPhone:       str.TrimPtrToNil(in.RecipientPhone),
		SourceIdempotencyKey: key,
		DeliveryMechanism:    in.Mechanism,
		Status:               status,
		Subject:              str.TrimPtrToNil(in.Subject),
		Body:                 in.Body,
		NextAttemptAt:        nextAttempt,
		ScheduledAt:          scheduled,
		EventTypeKey:         str.TrimPtrToNil(in.EventTypeKey),
		TemplateID:           str.TrimPtrToNil(in.TemplateID),
		CreatedBy:            in.RequestedBy,
		CreatedAt:            unix.Now(),
	}

	if _, err := d.db.NewInsert().Model(row).Exec(ctx); err != nil {
		return nil, false, connect.NewError(connect.CodeInternal, err)
	}

	return row, false, nil
}

// scheduleState computes the initial status + next_attempt_at + scheduled_at
// for an upsert, applying quiet-hours deferral. Returns (CREATED, nil, nil)
// when the row is immediately dispatchable.
func (d *bunNotificationDAO) scheduleState(scheduledMs *int64) (notificationv1.NotificationStatus, *unix.Timestamp, *unix.Timestamp) {
	var scheduled time.Time
	if scheduledMs != nil && *scheduledMs > 0 {
		scheduled = time.UnixMilli(*scheduledMs)
	}
	now := time.Now()
	effective := scheduled
	if d.quietHours != nil {
		effective = d.quietHours.Defer(scheduled, now)
	} else if effective.IsZero() {
		effective = now
	}
	var scheduledPtr *unix.Timestamp
	if scheduledMs != nil && *scheduledMs > 0 {
		scheduledPtr = unix.Int64PtrToTimestamp(scheduledMs)
	}
	if effective.UnixMilli() <= now.UnixMilli() {
		return notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED, nil, scheduledPtr
	}
	next := unix.Int64ToTimestamp(effective.UnixMilli())
	return notificationv1.NotificationStatus_NOTIFICATION_STATUS_WAITING, &next, scheduledPtr
}

func (d *bunNotificationDAO) ClaimPendingTx(ctx context.Context, tx bun.Tx) (*model.Notification, error) {
	var row model.Notification
	err := tx.NewSelect().
		Model(&row).
		Where("status IN (?, ?)",
			notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED,
			notificationv1.NotificationStatus_NOTIFICATION_STATUS_WAITING).
		Where("(next_attempt_at IS NULL OR next_attempt_at <= ?)", unix.Now()).
		Where("deleted_at IS NULL").
		OrderExpr("next_attempt_at NULLS FIRST, created_at").
		Limit(1).
		For("UPDATE SKIP LOCKED").
		Scan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (d *bunNotificationDAO) MarkSentTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy, providerMessageID string) error {
	notificationID = strings.TrimSpace(notificationID)
	if notificationID == "" {
		return errors.New("notification id is required")
	}

	providerID := strings.TrimSpace(providerMessageID)
	var providerIDArg interface{}
	if providerID != "" {
		providerIDArg = providerID
	}

	_, err := tx.NewRaw(`
		UPDATE notification.notification
		SET status = ?, sent_at = ?, error_message = NULL, attempt_count = attempt_count + 1,
		    last_attempt_at = ?, next_attempt_at = NULL,
		    provider_message_id = COALESCE(provider_message_id, ?),
		    updated_at = ?, updated_by = ?
		WHERE id = ?
	`,
		int(notificationv1.NotificationStatus_NOTIFICATION_STATUS_SENT),
		unix.Now(),
		unix.Now(),
		providerIDArg,
		unix.Now(),
		normalizeUpdatedBy(updatedBy),
		notificationID,
	).Exec(ctx)
	return err
}

func (d *bunNotificationDAO) ApplyDeliveryStatusTx(ctx context.Context, tx bun.Tx, actor, providerMessageID string, status notificationv1.NotificationDeliveryStatus, failureReason *string, eventAt int64) (bool, error) {
	providerID := strings.TrimSpace(providerMessageID)
	if providerID == "" {
		return false, nil
	}

	var failureArg interface{}
	if failureReason != nil {
		trimmed := strings.TrimSpace(*failureReason)
		if trimmed != "" {
			failureArg = trimmed
		}
	}

	result, err := tx.NewRaw(`
		UPDATE notification.notification
		SET delivery_status = ?, delivery_failure_reason = ?, delivery_status_updated_at = ?,
		    updated_at = ?, updated_by = ?
		WHERE provider_message_id = ?
		  AND (delivery_status_updated_at IS NULL OR delivery_status_updated_at < ?)
		  AND deleted_at IS NULL
	`,
		int(status),
		failureArg,
		eventAt,
		unix.Now(),
		normalizeUpdatedBy(actor),
		providerID,
		eventAt,
	).Exec(ctx)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func (d *bunNotificationDAO) MarkAttemptFailedTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy string, sendErr error, attemptCount int, nextAttemptAt *int64, terminal bool) error {
	notificationID = strings.TrimSpace(notificationID)
	if notificationID == "" {
		return errors.New("notification id is required")
	}

	status := int(notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED)
	if terminal {
		status = int(notificationv1.NotificationStatus_NOTIFICATION_STATUS_FAILED)
	}

	_, err := tx.NewRaw(`
		UPDATE notification.notification
		SET status = ?, error_message = ?, attempt_count = ?,
		    last_attempt_at = ?, next_attempt_at = ?,
		    updated_at = ?, updated_by = ?
		WHERE id = ?
	`,
		status,
		trimErrorMessage(sendErr),
		attemptCount,
		unix.Now(),
		nextAttemptAt,
		unix.Now(),
		normalizeUpdatedBy(updatedBy),
		notificationID,
	).Exec(ctx)
	return err
}

func applyNullableRecipientFilter(query *bun.SelectQuery, column string, value *string) *bun.SelectQuery {
	if value == nil {
		return query.Where(fmt.Sprintf("%s IS NULL", column))
	}
	return query.Where(fmt.Sprintf("%s = ?", column), *value)
}

func normalizeUpdatedBy(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func trimErrorMessage(err error) string {
	if err == nil {
		return ""
	}
	text := strings.TrimSpace(err.Error())
	if len(text) > 1000 {
		return text[:1000]
	}
	return text
}
