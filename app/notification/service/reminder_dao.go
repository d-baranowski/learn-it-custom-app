package service

import (
	"context"
	"time"

	"app/notification/model"

	"github.com/uptrace/bun"
)

type ScheduledReminderDAO interface {
	Insert(ctx context.Context, reminder *model.ScheduledReminder) error
	CancelByEntityID(ctx context.Context, entityID, eventTypeKey string) error
	UpdateFireAt(ctx context.Context, entityID, eventTypeKey string, newFireAt int64) error
	ClaimDue(ctx context.Context, tx bun.Tx, batchSize int) ([]*model.ScheduledReminder, error)
	ClaimDueGrouped(ctx context.Context, tx bun.Tx, windowMs int64) (map[string][]*model.ScheduledReminder, error)
	MarkFired(ctx context.Context, tx bun.Tx, reminderID string) error
	MarkFiredBatch(ctx context.Context, tx bun.Tx, reminderIDs []string) error
}

type bunScheduledReminderDAO struct {
	db *bun.DB
}

func NewScheduledReminderDAO(db *bun.DB) ScheduledReminderDAO {
	return &bunScheduledReminderDAO{db: db}
}

func (d *bunScheduledReminderDAO) Insert(ctx context.Context, reminder *model.ScheduledReminder) error {
	_, err := d.db.NewInsert().
		Model(reminder).
		On("CONFLICT (entity_id, event_type_key) WHERE status = 'PENDING' DO NOTHING").
		Exec(ctx)
	return err
}

func (d *bunScheduledReminderDAO) CancelByEntityID(ctx context.Context, entityID, eventTypeKey string) error {
	now := time.Now().UnixMilli()
	_, err := d.db.NewUpdate().
		Model((*model.ScheduledReminder)(nil)).
		Set("status = ?", model.ReminderStatusCancelled).
		Set("cancelled_at = ?", now).
		Set("updated_at = ?", now).
		Where("entity_id = ?", entityID).
		Where("event_type_key = ?", eventTypeKey).
		Where("status = ?", model.ReminderStatusPending).
		Exec(ctx)
	return err
}

func (d *bunScheduledReminderDAO) UpdateFireAt(ctx context.Context, entityID, eventTypeKey string, newFireAt int64) error {
	now := time.Now().UnixMilli()
	_, err := d.db.NewUpdate().
		Model((*model.ScheduledReminder)(nil)).
		Set("fire_at = ?", newFireAt).
		Set("updated_at = ?", now).
		Where("entity_id = ?", entityID).
		Where("event_type_key = ?", eventTypeKey).
		Where("status = ?", model.ReminderStatusPending).
		Exec(ctx)
	return err
}

func (d *bunScheduledReminderDAO) ClaimDue(ctx context.Context, tx bun.Tx, batchSize int) ([]*model.ScheduledReminder, error) {
	nowMs := time.Now().UnixMilli()
	var reminders []*model.ScheduledReminder
	err := tx.NewSelect().
		Model(&reminders).
		Where("status = ?", model.ReminderStatusPending).
		Where("fire_at <= ?", nowMs).
		OrderExpr("fire_at ASC").
		Limit(batchSize).
		For("UPDATE SKIP LOCKED").
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return reminders, nil
}

func (d *bunScheduledReminderDAO) ClaimDueGrouped(ctx context.Context, tx bun.Tx, windowMs int64) (map[string][]*model.ScheduledReminder, error) {
	nowMs := time.Now().UnixMilli()
	windowEnd := nowMs + windowMs

	var reminders []*model.ScheduledReminder
	err := tx.NewSelect().
		Model(&reminders).
		Where("status = ?", model.ReminderStatusPending).
		Where("fire_at <= ?", windowEnd).
		Where("recipient_user_id != ''").
		OrderExpr("recipient_user_id, fire_at ASC").
		For("UPDATE SKIP LOCKED").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]*model.ScheduledReminder)
	for _, r := range reminders {
		grouped[r.RecipientUserID] = append(grouped[r.RecipientUserID], r)
	}
	return grouped, nil
}

func (d *bunScheduledReminderDAO) MarkFiredBatch(ctx context.Context, tx bun.Tx, reminderIDs []string) error {
	if len(reminderIDs) == 0 {
		return nil
	}
	now := time.Now().UnixMilli()
	_, err := tx.NewUpdate().
		Model((*model.ScheduledReminder)(nil)).
		Set("status = ?", model.ReminderStatusFired).
		Set("fired_at = ?", now).
		Set("updated_at = ?", now).
		Where("id IN (?)", bun.In(reminderIDs)).
		Exec(ctx)
	return err
}

func (d *bunScheduledReminderDAO) MarkFired(ctx context.Context, tx bun.Tx, reminderID string) error {
	now := time.Now().UnixMilli()
	_, err := tx.NewUpdate().
		Model((*model.ScheduledReminder)(nil)).
		Set("status = ?", model.ReminderStatusFired).
		Set("fired_at = ?", now).
		Set("updated_at = ?", now).
		Where("id = ?", reminderID).
		Exec(ctx)
	return err
}
