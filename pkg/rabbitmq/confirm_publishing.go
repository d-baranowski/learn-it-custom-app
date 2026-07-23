package rabbitmq

import (
	"context"
	"errors"
)

func ConfirmPublishing(ctx context.Context, confirms PublisherConfirmation) (Action, error) {
	if len(confirms) == 0 || confirms[0] == nil {
		return NackRequeue, errors.New("message publishing not confirmed")
	}

	ok, err := confirms[0].WaitContext(ctx)
	if err != nil {
		return NackRequeue, err
	}

	if !ok {
		return NackRequeue, errors.New("message publishing not confirmed")
	}

	return Ack, nil
}
