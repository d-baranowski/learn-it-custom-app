package transform

import (
	"context"
	"fmt"
	"pkg/cdc/wal"

	"go.uber.org/zap"
)

type DomainEvent struct {
	RoutingKey string
	Payload    any
}

type TableTransformer interface {
	Transform(ctx context.Context, walEvent wal.Event) ([]DomainEvent, error)
}

type Registry struct {
	transformers map[string]TableTransformer
	log          *zap.Logger
}

func NewRegistry(log *zap.Logger) *Registry {
	return &Registry{
		transformers: make(map[string]TableTransformer),
		log:          log,
	}
}

func (r *Registry) Register(schemaTable string, t TableTransformer) {
	if _, exists := r.transformers[schemaTable]; exists {
		panic(fmt.Sprintf("duplicate transformer for %s", schemaTable))
	}
	r.transformers[schemaTable] = t
}

func (r *Registry) Transform(ctx context.Context, walEvent wal.Event) ([]DomainEvent, error) {
	key := walEvent.Schema + "." + walEvent.Table
	t, ok := r.transformers[key]
	if !ok {
		r.log.Debug("no transformer registered, skipping",
			zap.String("schema.table", key),
			zap.String("action", walEvent.Action.String()),
		)
		return nil, nil
	}
	return t.Transform(ctx, walEvent)
}
