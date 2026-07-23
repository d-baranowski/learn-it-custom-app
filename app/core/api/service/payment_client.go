package service

import (
	"context"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
)

func withPaymentHeaders[T any](ctx context.Context, req *connect.Request[T], fallbackSessionID string, fallbackUserID string) *connect.Request[T] {
	userID, _ := ctxHelpers.GetContextUserID(ctx)
	if userID == "" {
		userID = fallbackUserID
	}
	if userID != "" {
		req.Header().Set(ctxHelpers.XUserID, userID)
	}

	sessionID, _ := ctxHelpers.GetContextSessionID(ctx)
	if sessionID == "" {
		sessionID = fallbackSessionID
	}
	if sessionID != "" {
		req.Header().Set(ctxHelpers.XSessionID, sessionID)
	}

	return req
}
