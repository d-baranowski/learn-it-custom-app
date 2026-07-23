package logging

import (
	"context"
	"go.uber.org/zap"
)

type contextKey string

const (
	loggerContextKey = contextKey("logger")
)

func ContextWithLogger(ctx context.Context, logger *zap.Logger) context.Context {
	return context.WithValue(ctx, loggerContextKey, logger)
}

func GetLoggerFromContext(ctx context.Context) *zap.Logger {
	logger, ok := ctx.Value(loggerContextKey).(*zap.Logger)
	if ok {
		return logger
	}
	return zap.L()
}
