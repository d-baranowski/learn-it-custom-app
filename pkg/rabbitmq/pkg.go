package rabbitmq

import "errors"

var (
	ErrDeliveryBodyIsNil = errors.New("delivery body is nil")
	ErrMarshalBody       = errors.New("failed to marshal body")
	ErrPublish           = errors.New("failed to publish message")
)
