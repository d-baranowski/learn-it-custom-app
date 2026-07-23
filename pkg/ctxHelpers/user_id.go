package ctxHelpers

import (
	"context"
)

const (
	CRUDContextKey     = "api-crud"
	CtxUserIDKey       = "userID"
	CtxSessionIDKey    = "sessionID"
	CtxRequestModeKey  = "requestMode"
	XUserID            = "X-User-Id"
	XSessionID         = "X-Session-Id"
	XRequestMode       = "X-Request-Mode"
	RequestModeUser    = "user"
	RequestModeService = "service"
)

func GetContextUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(CtxUserIDKey).(string)
	if !ok {
		return "", false
	}
	if userID == "" {
		return "", false
	}
	return userID, true
}

func SetContextUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, CtxUserIDKey, userID)
}

func GetContextSessionID(ctx context.Context) (string, bool) {
	sessionID, ok := ctx.Value(CtxSessionIDKey).(string)
	if !ok {
		return "", false
	}
	if sessionID == "" {
		return "", false
	}
	return sessionID, true
}

func SetContextRequestMode(ctx context.Context, mode string) context.Context {
	return context.WithValue(ctx, CtxRequestModeKey, mode)
}

func IsServiceMode(ctx context.Context) bool {
	mode, ok := ctx.Value(CtxRequestModeKey).(string)
	return ok && mode == RequestModeService
}

func SetApiContext(ctx context.Context) context.Context {
	return context.WithValue(ctx, CRUDContextKey, true)
}

func GetApiContext(ctx context.Context) bool {
	if ctx.Value(CRUDContextKey) != nil {
		return ctx.Value(CRUDContextKey).(bool)
	}
	return false
}
