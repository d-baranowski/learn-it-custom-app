package pgmq

import (
	"context"
	"encoding/json"
	"fmt"
)

// Handler processes a single event payload for a routing key. Returning an
// error triggers the worker's retry/backoff logic.
type Handler func(ctx context.Context, payload json.RawMessage) error

// Registry maps routing keys to handlers for a consumer worker.
type Registry struct {
	handlers map[string]Handler
}

func NewRegistry() *Registry {
	return &Registry{handlers: make(map[string]Handler)}
}

func (r *Registry) Register(routingKey string, handler Handler) {
	if _, exists := r.handlers[routingKey]; exists {
		panic(fmt.Sprintf("duplicate event handler for routing key %q", routingKey))
	}
	r.handlers[routingKey] = handler
}

func (r *Registry) Get(routingKey string) (Handler, bool) {
	h, ok := r.handlers[routingKey]
	return h, ok
}
