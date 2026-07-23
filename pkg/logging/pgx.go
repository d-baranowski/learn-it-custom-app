package logging

import (
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

import (
	"context"

	"github.com/jackc/pgx/v5/tracelog"
	"go.uber.org/zap/zapcore"
)

type PgxLogger struct {
	logger *zap.Logger
}

func NewPgxLogger(logger *zap.Logger) *PgxLogger {
	return &PgxLogger{logger: logger.WithOptions(zap.AddCallerSkip(1))}
}

func (pl *PgxLogger) Log(ctx context.Context, level tracelog.LogLevel, msg string, data map[string]interface{}) {
	fields := make([]zapcore.Field, len(data))
	i := 0
	for k, v := range data {
		fields[i] = zap.Any(k, v)
		i++
	}

	switch level {
	case tracelog.LogLevelTrace:
		pl.logger.Debug(msg, append(fields, zap.Stringer("PGX_LOG_LEVEL", level))...)
	case tracelog.LogLevelDebug:
		pl.logger.Debug(msg, fields...)
	case tracelog.LogLevelInfo:
		pl.logger.Info(msg, fields...)
	case tracelog.LogLevelWarn:
		pl.logger.Warn(msg, fields...)
	case tracelog.LogLevelError:
		pl.logger.Error(msg, fields...)
	default:
		pl.logger.Error(msg, append(fields, zap.Stringer("PGX_LOG_LEVEL", level))...)
	}
}

type PgxQueryTracer struct {
	log *zap.SugaredLogger
}

func NewPgxQueryTracer(log *zap.SugaredLogger) *PgxQueryTracer {
	return &PgxQueryTracer{log: log}
}

func (tracer *PgxQueryTracer) TraceQueryStart(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	tracer.log.Infow("Executing command", "sql", data.SQL, "args", data.Args)
	return ctx
}

func (tracer *PgxQueryTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	if data.Err != nil {
		tracer.log.Errorw("Command failed", "error", data.Err)
		return
	}

	tracer.log.Infow("Command completed", "command_tag", data.CommandTag)
}
