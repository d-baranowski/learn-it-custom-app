package store

import (
	"context"
	"testing"
	"time"
)

func TestRetryBackoff_ResetAndGrowth(t *testing.T) {
	b := newRetryBackoff(10*time.Millisecond, 40*time.Millisecond)

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	start := time.Now()
	b.Sleep(ctx)
	first := time.Since(start)
	if first < 5*time.Millisecond {
		t.Fatalf("expected first sleep to be >= ~min, got %v", first)
	}

	start = time.Now()
	b.Sleep(ctx)
	second := time.Since(start)
	if second < first {
		t.Fatalf("expected second sleep >= first (backoff growth), got first=%v second=%v", first, second)
	}

	b.Reset()
	start = time.Now()
	b.Sleep(ctx)
	third := time.Since(start)
	if third > second {
		t.Fatalf("expected reset sleep to be smaller/equal than grown backoff, got third=%v second=%v", third, second)
	}
}
