package tracing

import (
	"context"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

type Tracer struct {
	tracer trace.Tracer
	log    *zap.Logger
}

func NewTracer(name string) *Tracer {
	return &Tracer{
		tracer: otel.Tracer(name),
		log:    zap.L().Named(name),
	}
}

func (t *Tracer) Start(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span, *zap.Logger) {
	//if t == nil {
	//	tp := noop.NewTracerProvider()
	//	spanCtx, span := tp.tracer("noop").Start(ctx, name, opts...)
	//	return spanCtx, span, zap.L()
	//}

	spanCtx, span := t.tracer.Start(ctx, name, opts...)

	if NewSpanLogger == nil {
		NewSpanLogger = DefaultSpanLoggerFromSpan
	}

	logger := NewSpanLogger(span)

	return spanCtx, span, logger
}
