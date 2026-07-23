package api

import (
	"context"
	"errors"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
)

type BaseInterceptor struct {
	callback      func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error)
	interceptor   connect.UnaryInterceptorFunc
	withSessionID bool
}

type BaseInterceptorOption func(*BaseInterceptor)

func WithBaseInterceptorCallback(cb func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error)) BaseInterceptorOption {
	return func(bi *BaseInterceptor) {
		bi.callback = cb
	}
}

func WithBaseInterceptorSID(sid bool) BaseInterceptorOption {
	return func(bi *BaseInterceptor) {
		bi.withSessionID = sid
	}
}

func NewBaseInterceptor(opts ...BaseInterceptorOption) *BaseInterceptor {
	i := &BaseInterceptor{}

	for _, opt := range opts {
		opt(i)
	}

	i.interceptor = func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			if !req.Spec().IsClient {
				requestMode := req.Header().Get(ctxHelpers.XRequestMode)
				isServiceMode := requestMode == ctxHelpers.RequestModeService

				if isServiceMode {
					ctx = ctxHelpers.SetContextRequestMode(ctx, ctxHelpers.RequestModeService)
					userID := req.Header().Get(ctxHelpers.XUserID)
					if userID != "" {
						ctx = ctxHelpers.SetContextUserID(ctx, userID)
					}
				} else {
					userID := req.Header().Get(ctxHelpers.XUserID)
					if userID == "" {
						return nil, connect.NewError(
							connect.CodeUnauthenticated,
							errors.New("no userID provided"),
						)
					}
					ctx = ctxHelpers.SetContextUserID(ctx, userID)

					if i.withSessionID {
						sessionID := req.Header().Get(ctxHelpers.XSessionID)
						if sessionID == "" {
							return nil, connect.NewError(
								connect.CodeUnauthenticated,
								errors.New("no sessionID provided"),
							)
						}
						ctx = context.WithValue(ctx, ctxHelpers.CtxSessionIDKey, sessionID)
					}
				}

				if i.callback != nil {
					if resp, err := i.callback(ctx, req); err != nil {
						return resp, err
					}
				}
			}

			return next(ctx, req)
		}
	}

	return i
}

func (i *BaseInterceptor) Interceptor() connect.UnaryInterceptorFunc {
	return i.interceptor
}
