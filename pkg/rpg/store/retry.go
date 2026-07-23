package store

import (
	"context"
	"time"
)

type retryBackoff struct {
	min time.Duration
	max time.Duration
	cur time.Duration
}

func newRetryBackoff(min, max time.Duration) *retryBackoff {
	if min <= 0 {
		min = 250 * time.Millisecond
	}
	if max <= 0 {
		max = 10 * time.Second
	}
	if max < min {
		max = min
	}
	return &retryBackoff{min: min, max: max, cur: min}
}

func (b *retryBackoff) Reset() { b.cur = b.min }

func (b *retryBackoff) Sleep(ctx context.Context) {
	// No jitter for now; keep it deterministic.
	t := b.cur
	if b.cur < b.max {
		next := b.cur * 2
		if next > b.max {
			next = b.max
		}
		b.cur = next
	}

	timer := time.NewTimer(t)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
		return
	}
}
