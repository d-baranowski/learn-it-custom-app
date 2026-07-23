package model

import (
	"context"
	notificationv1 "app/notification/gen/notification/v1"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Notification struct {
	bun.BaseModel `bun:"table:notification.notification,alias:notification_entry"`

	Id                   string                                       `bun:"id,pk,nullzero" json:"id"`
	RecipientUserId      *string                                      `bun:"recipient_user_id" json:"recipientUserId"`
	RecipientLabel       *string                                      `bun:"recipient_label" json:"recipientLabel"`
	RecipientEmail       *string                                      `bun:"recipient_email" json:"recipientEmail"`
	RecipientPhone       *string                                      `bun:"recipient_phone" json:"recipientPhone"`
	SourceIdempotencyKey *string                                      `bun:"source_idempotency_key" json:"-"`
	DeliveryMechanism    notificationv1.NotificationDeliveryMechanism `bun:"delivery_mechanism,notnull" json:"deliveryMechanism"`
	Status               notificationv1.NotificationStatus            `bun:"status,notnull" json:"status"`
	Subject              *string                                      `bun:"subject" json:"subject"`
	Body                 string                                       `bun:"body,notnull" json:"body"`
	ErrorMessage         *string                                      `bun:"error_message" json:"errorMessage"`
	SentAt               *unix.Timestamp                              `bun:"sent_at" json:"sentAt"`
	AttemptCount         int                                          `bun:"attempt_count,notnull" json:"attemptCount"`
	LastAttemptAt        *unix.Timestamp                              `bun:"last_attempt_at" json:"lastAttemptAt"`
	NextAttemptAt        *unix.Timestamp                              `bun:"next_attempt_at" json:"nextAttemptAt"`
	ProviderMessageId       *string                                  `bun:"provider_message_id" json:"providerMessageId"`
	DeliveryStatus          notificationv1.NotificationDeliveryStatus `bun:"delivery_status,notnull" json:"deliveryStatus"`
	DeliveryStatusUpdatedAt *unix.Timestamp                          `bun:"delivery_status_updated_at" json:"deliveryStatusUpdatedAt"`
	DeliveryFailureReason   *string                                  `bun:"delivery_failure_reason" json:"deliveryFailureReason"`
	ScheduledAt             *unix.Timestamp                          `bun:"scheduled_at" json:"scheduledAt"`
	EventTypeKey            *string                                  `bun:"event_type_key" json:"eventTypeKey"`
	TemplateID              *string                                  `bun:"template_id" json:"templateId"`

	CreatedAt unix.Timestamp  `bun:"created_at,notnull" json:"createdAt"`
	CreatedBy string          `bun:"created_by,notnull" json:"createdBy"`
	UpdatedAt *unix.Timestamp `bun:"updated_at" json:"updatedAt"`
	UpdatedBy *string         `bun:"updated_by" json:"updatedBy"`
	DeletedAt *unix.Timestamp `bun:"deleted_at" json:"deletedAt"`
	DeletedBy *string         `bun:"deleted_by" json:"deletedBy"`
}

func (m *Notification) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("notification.notification AS notification_entry").
		ColumnExpr("notification_entry.*")
}
