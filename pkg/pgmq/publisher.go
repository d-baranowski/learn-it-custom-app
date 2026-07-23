package pgmq

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"pkg/tracing"

	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type Publisher interface {
	SendTopic(ctx context.Context, db bun.IDB, routingKey string, payload any) error
}

type bunPublisher struct {
	publisherID string
	log         *zap.Logger
	tracer      *tracing.Tracer
}

func NewPublisher(publisherID string, log *zap.Logger) Publisher {
	return &bunPublisher{
		publisherID: publisherID,
		log:         log.Named("pgmq.publisher"),
		tracer:      tracing.NewTracer("pgmq.publisher"),
	}
}

func (p *bunPublisher) SendTopic(ctx context.Context, db bun.IDB, routingKey string, payload any) error {
	ctx, span, log := p.tracer.Start(ctx, "pgmq.send_topic",
		trace.WithSpanKind(trace.SpanKindProducer),
	)
	defer span.End()

	span.SetAttributes(
		attribute.String("pgmq.routing_key", routingKey),
		attribute.String("pgmq.publisher_id", p.publisherID),
	)

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("marshal payload for %q: %w", routingKey, err)
	}

	span.SetAttributes(attribute.Int("pgmq.payload_size", len(payloadBytes)))

	envelope := Envelope{
		RoutingKey:  routingKey,
		PublisherID: p.publisherID,
		PublishedAt: time.Now().UnixMilli(),
		Payload:     payloadBytes,
	}

	envelopeBytes, err := json.Marshal(envelope)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("marshal envelope for %q: %w", routingKey, err)
	}

	var result int
	err = db.NewRaw("SELECT pgmq.send_topic(?, ?::jsonb)", routingKey, string(envelopeBytes)).Scan(ctx, &result)
	if err != nil {
		span.RecordError(err)
		log.Error("failed to publish event",
			zap.String("routing_key", routingKey),
			zap.Error(err),
		)
		return fmt.Errorf("pgmq.send_topic %q: %w", routingKey, err)
	}

	log.Debug("event published",
		zap.String("routing_key", routingKey),
		zap.Int("queues_matched", result),
	)

	return nil
}
