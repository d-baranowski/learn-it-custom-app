package model

import (
	"context"
	"encoding/json"
	"pkg/repository"

	"github.com/uptrace/bun"
)

const (
	ReminderStatusPending   = "PENDING"
	ReminderStatusFired     = "FIRED"
	ReminderStatusCancelled = "CANCELLED"
)

type ScheduledReminder struct {
	bun.BaseModel `bun:"table:notification.scheduled_reminder,alias:scheduled_reminder"`

	Id              string          `bun:"id,pk,nullzero" json:"id"`
	EventTypeKey    string          `bun:"event_type_key,notnull" json:"eventTypeKey"`
	EntityID        string          `bun:"entity_id,notnull" json:"entityId"`
	EntityType      string          `bun:"entity_type,notnull" json:"entityType"`
	RecipientUserID string          `bun:"recipient_user_id" json:"recipientUserId"`
	FireAt       int64           `bun:"fire_at,notnull" json:"fireAt"`
	Status       string          `bun:"status,notnull" json:"status"`
	Payload      json.RawMessage `bun:"payload,notnull,type:jsonb" json:"payload"`
	CancelledAt  *int64          `bun:"cancelled_at" json:"cancelledAt"`
	FiredAt      *int64          `bun:"fired_at" json:"firedAt"`
	CreatedAt    int64           `bun:"created_at,notnull" json:"createdAt"`
	UpdatedAt    *int64          `bun:"updated_at" json:"updatedAt"`
}

func (m *ScheduledReminder) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("notification.scheduled_reminder AS scheduled_reminder").
		ColumnExpr("scheduled_reminder.*")
}
