package pgmq

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"go.uber.org/zap"
)

// fakeConsumer records ack/nack calls and serves a fixed batch once.
type fakeConsumer struct {
	batch    []QueueMessage
	served   bool
	acked    []int64
	nacked   []int64
	nackWait []time.Duration
}

func (f *fakeConsumer) Read(_ context.Context, _ string, _ int, _ time.Duration) ([]QueueMessage, error) {
	if f.served {
		return nil, nil
	}
	f.served = true
	return f.batch, nil
}

func (f *fakeConsumer) Ack(_ context.Context, _ string, msgID int64) error {
	f.acked = append(f.acked, msgID)
	return nil
}

func (f *fakeConsumer) Nack(_ context.Context, _ string, msgID int64, retryAfter time.Duration) error {
	f.nacked = append(f.nacked, msgID)
	f.nackWait = append(f.nackWait, retryAfter)
	return nil
}

func msg(id int64, readCount int32, routingKey string) QueueMessage {
	return QueueMessage{
		MsgID:     id,
		ReadCount: readCount,
		Message: Envelope{
			RoutingKey: routingKey,
			Payload:    json.RawMessage(`{}`),
		},
	}
}

func newTestWorker(c Consumer, r *Registry) *Worker {
	return NewWorker(c, r, ConsumerConfig{
		QueueName:         "test_queue",
		BatchSize:         10,
		VisibilityTimeout: 30,
		MaxRetries:        3,
	}, zap.NewNop())
}

func TestWorkerAcksOnSuccess(t *testing.T) {
	reg := NewRegistry()
	reg.Register("thing.happened", func(_ context.Context, _ json.RawMessage) error { return nil })
	fc := &fakeConsumer{batch: []QueueMessage{msg(1, 0, "thing.happened")}}

	newTestWorker(fc, reg).processBatch(context.Background())

	if len(fc.acked) != 1 || fc.acked[0] != 1 {
		t.Fatalf("expected msg 1 acked, got acked=%v nacked=%v", fc.acked, fc.nacked)
	}
	if len(fc.nacked) != 0 {
		t.Fatalf("expected no nacks, got %v", fc.nacked)
	}
}

func TestWorkerNacksWithBackoffOnError(t *testing.T) {
	reg := NewRegistry()
	reg.Register("thing.happened", func(_ context.Context, _ json.RawMessage) error { return errors.New("boom") })
	fc := &fakeConsumer{batch: []QueueMessage{msg(2, 1, "thing.happened")}}

	newTestWorker(fc, reg).processBatch(context.Background())

	if len(fc.nacked) != 1 || fc.nacked[0] != 2 {
		t.Fatalf("expected msg 2 nacked, got acked=%v nacked=%v", fc.acked, fc.nacked)
	}
	if len(fc.acked) != 0 {
		t.Fatalf("expected no acks, got %v", fc.acked)
	}
	if fc.nackWait[0] <= 0 {
		t.Fatalf("expected positive backoff, got %v", fc.nackWait[0])
	}
}

func TestWorkerDropsPastMaxRetries(t *testing.T) {
	reg := NewRegistry()
	reg.Register("thing.happened", func(_ context.Context, _ json.RawMessage) error { return errors.New("boom") })
	// ReadCount 3 == MaxRetries 3 → drop (ack), no nack.
	fc := &fakeConsumer{batch: []QueueMessage{msg(3, 3, "thing.happened")}}

	newTestWorker(fc, reg).processBatch(context.Background())

	if len(fc.acked) != 1 || fc.acked[0] != 3 {
		t.Fatalf("expected msg 3 dropped (acked), got acked=%v nacked=%v", fc.acked, fc.nacked)
	}
	if len(fc.nacked) != 0 {
		t.Fatalf("expected no nacks at max retries, got %v", fc.nacked)
	}
}

func TestWorkerAcksUnknownRoutingKey(t *testing.T) {
	reg := NewRegistry()
	fc := &fakeConsumer{batch: []QueueMessage{msg(4, 0, "unmapped.key")}}

	newTestWorker(fc, reg).processBatch(context.Background())

	if len(fc.acked) != 1 || fc.acked[0] != 4 {
		t.Fatalf("expected unknown-key msg 4 acked/dropped, got acked=%v nacked=%v", fc.acked, fc.nacked)
	}
}

func TestRegistryPanicsOnDuplicate(t *testing.T) {
	reg := NewRegistry()
	reg.Register("k", func(_ context.Context, _ json.RawMessage) error { return nil })
	defer func() {
		if recover() == nil {
			t.Fatal("expected panic on duplicate registration")
		}
	}()
	reg.Register("k", func(_ context.Context, _ json.RawMessage) error { return nil })
}
