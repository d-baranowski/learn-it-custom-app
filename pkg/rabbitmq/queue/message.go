package queue

import (
	"context"
	"pkg/rabbitmq"
)

// Message holds the message to be processed
type Message struct {
	Ctx      context.Context
	Delivery rabbitmq.Delivery
	RespChan chan MessageResponse
}

// MessageResponse holds the result of message processing
type MessageResponse struct {
	Action rabbitmq.Action
	Err    error
}
