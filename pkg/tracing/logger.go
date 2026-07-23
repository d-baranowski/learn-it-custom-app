package tracing

import (
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"strconv"
)

type SpanLoggerFunc func(span trace.Span) *zap.Logger

var NewSpanLogger SpanLoggerFunc

func SpanLoggerProvider(config *Config) {
	switch true {
	case config.DataDog:
		NewSpanLogger = DataDogLoggerFromSpan
	default:
		NewSpanLogger = DefaultSpanLoggerFromSpan
	}
}

// todo: other logger implementations if ever needed

func DefaultSpanLoggerFromSpan(span trace.Span) *zap.Logger {
	if span == nil {
		return zap.L()
	}

	logger := zap.L().With(
		zap.String("trace_id", span.SpanContext().TraceID().String()),
		zap.String("span_id", span.SpanContext().SpanID().String()),
	)

	return logger
}

func DataDogLoggerFromSpan(span trace.Span) *zap.Logger {
	if span == nil {
		return zap.L()
	}

	convertTraceID := func(id string) string {
		if len(id) < 16 {
			return ""
		}
		if len(id) > 16 {
			id = id[16:]
		}
		intValue, err := strconv.ParseUint(id, 16, 64)
		if err != nil {
			return ""
		}
		return strconv.FormatUint(intValue, 10)
	}

	logger := zap.L().With(
		zap.String("dd.trace_id", convertTraceID(span.SpanContext().TraceID().String())),
		zap.String("dd.span_id", convertTraceID(span.SpanContext().SpanID().String())),
	)

	return logger
}
