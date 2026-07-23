package main

import (
	"app/core-event/transform"
	"context"
	"encoding/json"
	"fmt"
	"pkg/cdc/wal"
	"pkg/pgmq"
	"pkg/tracing"
	"time"

	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type pgmqPublisher struct {
	filter   *wal.Filter
	registry *transform.Registry
	db       *bun.DB
	log      *zap.Logger
	tracer   *tracing.Tracer
}

func newPgmqPublisher(filter *wal.Filter, registry *transform.Registry, db *bun.DB, log *zap.Logger) wal.EventPublisher {
	return &pgmqPublisher{
		filter:   filter,
		registry: registry,
		db:       db,
		log:      log.Named("core-event.publisher"),
		tracer:   tracing.NewTracer("core-event.publisher"),
	}
}

func (p *pgmqPublisher) Filter() *wal.Filter {
	return p.filter
}

func (p *pgmqPublisher) Publish(ctx context.Context, walEvent wal.Event) error {
	ctx, span, _ := p.tracer.Start(ctx, "core-event.publish",
		trace.WithSpanKind(trace.SpanKindProducer),
	)
	defer span.End()

	span.SetAttributes(
		attribute.String("wal.schema", walEvent.Schema),
		attribute.String("wal.table", walEvent.Table),
		attribute.String("wal.action", walEvent.Action.String()),
	)

	domainEvents, err := p.registry.Transform(ctx, walEvent)
	if err != nil {
		span.RecordError(err)
		p.log.Error("transform failed",
			zap.String("schema", walEvent.Schema),
			zap.String("table", walEvent.Table),
			zap.String("action", walEvent.Action.String()),
			zap.Error(err),
		)
		return err
	}

	span.SetAttributes(attribute.Int("domain_events.count", len(domainEvents)))

	for _, de := range domainEvents {
		if err := p.sendTopic(ctx, de); err != nil {
			span.RecordError(err)
			p.log.Error("failed to publish domain event",
				zap.String("routing_key", de.RoutingKey),
				zap.Error(err),
			)
			return err
		}

		p.log.Debug("domain event published",
			zap.String("routing_key", de.RoutingKey),
		)
	}

	return nil
}

func (p *pgmqPublisher) sendTopic(ctx context.Context, de transform.DomainEvent) error {
	payloadBytes, err := json.Marshal(de.Payload)
	if err != nil {
		return fmt.Errorf("marshal payload for %q: %w", de.RoutingKey, err)
	}

	envelope := pgmq.Envelope{
		RoutingKey:  de.RoutingKey,
		PublisherID: "core-event",
		PublishedAt: time.Now().UnixMilli(),
		Payload:     payloadBytes,
	}

	envelopeBytes, err := json.Marshal(envelope)
	if err != nil {
		return fmt.Errorf("marshal envelope for %q: %w", de.RoutingKey, err)
	}

	var result int
	err = p.db.NewRaw("SELECT pgmq.send_topic(?, ?::jsonb)", de.RoutingKey, string(envelopeBytes)).Scan(ctx, &result)
	if err != nil {
		return fmt.Errorf("pgmq.send_topic %q: %w", de.RoutingKey, err)
	}

	return nil
}
