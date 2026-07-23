package tracing

import (
	"context"
	"database/sql"
	"runtime"
	"strings"

	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"
)

// tracerName matches what bunotel uses, so existing dashboards/queries
// keyed on the instrumentation scope keep working.
const bunTracerName = "github.com/uptrace/bun"

type BunQueryHook struct {
	tracer    trace.Tracer
	dbName    string
	noRowsErr bool
}

// NewBunQueryHook returns a bun.QueryHook that emits OTel spans for every
// SQL operation. Unlike bunotel.NewQueryHook (which it replaces), this one
// resolves the call site by walking the stack past *both* uptrace/bun and
// pkg/tracing frames, so spans point at the actual repository / handler
// caller instead of always at the wrapper.
//
// Parameters mirror the previous bunotel-based implementation:
//   - name:      logical DB name written to the db.name attribute.
//   - noRowsErr: when false, sql.ErrNoRows is silenced (cleared on the
//     event so the caller doesn't propagate it as a failure).
func NewBunQueryHook(name string, noRowsErr bool) bun.QueryHook {
	return &BunQueryHook{
		tracer:    otel.Tracer(bunTracerName),
		dbName:    name,
		noRowsErr: noRowsErr,
	}
}

func (h *BunQueryHook) BeforeQuery(ctx context.Context, _ *bun.QueryEvent) context.Context {
	ctx, _ = h.tracer.Start(ctx, "", trace.WithSpanKind(trace.SpanKindClient))
	return ctx
}

func (h *BunQueryHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
	if event.Err == sql.ErrNoRows && !h.noRowsErr {
		event.Err = nil
	}

	span := trace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	defer span.End()

	operation := event.Operation()
	span.SetName(operation)

	fn, file, line := callerOutsideFramework()

	attrs := []attribute.KeyValue{
		semconv.DBSystemPostgreSQL,
		attribute.String("db.name", h.dbName),
		attribute.String("db.operation", operation),
		attribute.String("db.statement", event.Query),
		attribute.String("code.function", fn),
		attribute.String("code.filepath", file),
		attribute.Int("code.lineno", line),
	}
	if event.Result != nil {
		if n, rowsErr := event.Result.RowsAffected(); rowsErr == nil && n > 0 {
			attrs = append(attrs, attribute.Int64("db.rows_affected", n))
		}
	}
	span.SetAttributes(attrs...)

	switch {
	case event.Err == nil, event.Err == sql.ErrNoRows, event.Err == sql.ErrTxDone:
		// not an error
	default:
		span.RecordError(event.Err)
		span.SetStatus(codes.Error, event.Err.Error())
	}
}

// callerOutsideFramework walks up the goroutine's call stack and returns
// the first frame that isn't part of bun, the standard sql package, the
// runtime, or this wrapper. Falls back to ("", "", 0) if every frame is
// framework code (shouldn't happen in practice).
func callerOutsideFramework() (fn, file string, line int) {
	pcs := make([]uintptr, 32)
	// skip runtime.Callers, this fn, and the caller of this fn (AfterQuery)
	n := runtime.Callers(3, pcs)
	if n == 0 {
		return "", "", 0
	}
	frames := runtime.CallersFrames(pcs[:n])
	for {
		f, more := frames.Next()
		if !isFrameworkFrame(f.File, f.Function) {
			return f.Function, f.File, f.Line
		}
		if !more {
			return "", "", 0
		}
	}
}

func isFrameworkFrame(file, fn string) bool {
	switch {
	case strings.Contains(file, "/pkg/tracing/"):
		return true
	case strings.Contains(file, "/github.com/uptrace/bun"):
		return true
	case strings.Contains(file, "/database/sql/"):
		return true
	case strings.HasPrefix(fn, "runtime."), strings.HasPrefix(fn, "reflect."):
		return true
	}
	return false
}
