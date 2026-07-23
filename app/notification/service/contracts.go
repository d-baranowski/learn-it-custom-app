package service

import "context"

type EmailMessage struct {
	ToEmail        string
	Subject        string
	Body           string
	IdempotencyKey *string
}

type SMSMessage struct {
	ToPhone        string
	Body           string
	IdempotencyKey *string
}

type EmailSender interface {
	Send(ctx context.Context, message EmailMessage) (providerMessageID string, err error)
}

type SMSSender interface {
	Send(ctx context.Context, message SMSMessage) (providerMessageID string, err error)
}
