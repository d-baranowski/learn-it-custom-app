package queue

import "context"

type DelayQueue interface {
	BindQueue(queueName, routingKey string) error
	Cancel(_ context.Context, msgID string) error
	Enqueue(ctx context.Context,
		msgID string, body interface{}, headers map[string]interface{},
		routingKey string, cancellable bool, delay int) error
}
