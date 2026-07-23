package wal

import "context"

type EventPublisher interface {
	Filter() *Filter
	Publish(ctx context.Context, event Event) error
}
