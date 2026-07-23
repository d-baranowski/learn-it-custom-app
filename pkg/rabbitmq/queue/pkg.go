package queue

import "errors"

const (
	DefaultVHost = "/"

	EventQueue    = "rmq-events"
	EventExchange = "amq.rabbitmq.event"

	HeaderCancellable = "q-cancellable"
	HeaderExpiry      = "q-expiry"
	HeaderID          = "q-id"
	HeaderReplyPath   = "q-reply-path"
)

var (
	ErrAlreadyDispatched = errors.New("message already dispatched")
	ErrQueueMode         = errors.New("queue mode error")
)
