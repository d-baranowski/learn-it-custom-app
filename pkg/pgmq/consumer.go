package pgmq

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"pkg/tracing"

	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type Consumer interface {
	Read(ctx context.Context, queueName string, batchSize int, visibilityTimeout time.Duration) ([]QueueMessage, error)
	Ack(ctx context.Context, queueName string, msgID int64) error
	Nack(ctx context.Context, queueName string, msgID int64, retryAfter time.Duration) error
}

type bunConsumer struct {
	db     *bun.DB
	log    *zap.Logger
	tracer *tracing.Tracer
}

func NewConsumer(db *bun.DB, log *zap.Logger) Consumer {
	return &bunConsumer{
		db:     db,
		log:    log.Named("pgmq.consumer"),
		tracer: tracing.NewTracer("pgmq.consumer"),
	}
}

type pgmqReadRow struct {
	MsgID      int64      `bun:"msg_id"`
	ReadCt     int32      `bun:"read_ct"`
	EnqueuedAt time.Time  `bun:"enqueued_at"`
	LastReadAt *time.Time `bun:"last_read_at"`
	VT         time.Time  `bun:"vt"`
	Message    string     `bun:"message"`
	Headers    *string    `bun:"headers"`
}

func (c *bunConsumer) Read(ctx context.Context, queueName string, batchSize int, visibilityTimeout time.Duration) ([]QueueMessage, error) {
	ctx, span, _ := c.tracer.Start(ctx, "pgmq.read",
		trace.WithSpanKind(trace.SpanKindConsumer),
	)
	defer span.End()

	span.SetAttributes(
		attribute.String("pgmq.queue_name", queueName),
		attribute.Int("pgmq.batch_size", batchSize),
	)

	vtSeconds := int(visibilityTimeout.Seconds())
	if vtSeconds < 1 {
		vtSeconds = 30
	}

	var rows []pgmqReadRow
	err := c.db.NewRaw("SELECT * FROM pgmq.read(?, ?, ?)", queueName, vtSeconds, batchSize).Scan(ctx, &rows)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			span.SetAttributes(attribute.Int("pgmq.messages_read", 0))
			return nil, nil
		}
		span.RecordError(err)
		return nil, fmt.Errorf("pgmq.read %q: %w", queueName, err)
	}

	messages := make([]QueueMessage, 0, len(rows))
	for _, row := range rows {
		var envelope Envelope
		if err := json.Unmarshal([]byte(row.Message), &envelope); err != nil {
			c.log.Warn("failed to unmarshal pgmq message envelope",
				zap.String("queue_name", queueName),
				zap.Int64("msg_id", row.MsgID),
				zap.Error(err),
			)
			continue
		}
		messages = append(messages, QueueMessage{
			MsgID:      row.MsgID,
			ReadCount:  row.ReadCt,
			EnqueuedAt: row.EnqueuedAt,
			VT:         row.VT,
			Message:    envelope,
		})
	}

	span.SetAttributes(attribute.Int("pgmq.messages_read", len(messages)))

	c.log.Debug("messages read",
		zap.String("queue_name", queueName),
		zap.Int("count", len(messages)),
	)

	return messages, nil
}

func (c *bunConsumer) Ack(ctx context.Context, queueName string, msgID int64) error {
	_, span, _ := c.tracer.Start(ctx, "pgmq.ack")
	defer span.End()

	span.SetAttributes(
		attribute.String("pgmq.queue_name", queueName),
		attribute.Int64("pgmq.msg_id", msgID),
	)

	var deleted bool
	err := c.db.NewRaw("SELECT pgmq.delete(?, ?)", queueName, msgID).Scan(ctx, &deleted)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("pgmq.delete %q msg %d: %w", queueName, msgID, err)
	}

	c.log.Debug("message acked",
		zap.String("queue_name", queueName),
		zap.Int64("msg_id", msgID),
	)

	return nil
}

func (c *bunConsumer) Nack(ctx context.Context, queueName string, msgID int64, retryAfter time.Duration) error {
	_, span, _ := c.tracer.Start(ctx, "pgmq.nack")
	defer span.End()

	span.SetAttributes(
		attribute.String("pgmq.queue_name", queueName),
		attribute.Int64("pgmq.msg_id", msgID),
		attribute.Float64("pgmq.retry_after_seconds", retryAfter.Seconds()),
	)

	vtSeconds := int(retryAfter.Seconds())
	if vtSeconds < 1 {
		vtSeconds = 1
	}

	var newVT time.Time
	err := c.db.NewRaw("SELECT pgmq.set_vt(?, ?, ?)", queueName, msgID, vtSeconds).Scan(ctx, &newVT)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("pgmq.set_vt %q msg %d: %w", queueName, msgID, err)
	}

	c.log.Debug("message nacked",
		zap.String("queue_name", queueName),
		zap.Int64("msg_id", msgID),
		zap.Int("retry_after_seconds", vtSeconds),
	)

	return nil
}
