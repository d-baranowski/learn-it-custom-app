package health

import (
	"errors"
)

var (
	ErrNotLive  = errors.New("not live")
	ErrNotReady = errors.New("not ready")
)
