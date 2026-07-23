package service

import notificationv1 "app/notification/gen/notification/v1"

// NotificationUpsertModel carries recipient details, content, and metadata
// used by the DAO to find-or-create a notification row for send requests.
type NotificationUpsertModel struct {
	RecipientUserID *string
	RecipientLabel  *string
	RecipientEmail  *string
	RecipientPhone  *string
	Subject         *string
	Body            string
	Mechanism       notificationv1.NotificationDeliveryMechanism
	IdempotencyKey  *string
	ScheduledAt     *int64
	RequestedBy     string
	EventTypeKey    *string
	TemplateID      *string
}
