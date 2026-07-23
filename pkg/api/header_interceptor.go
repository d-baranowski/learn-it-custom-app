package api

import (
	"context"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
)

type HeaderInterceptor struct {
	callback      func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error)
	interceptor   connect.UnaryInterceptorFunc
	withSessionID bool
}

type HeaderInterceptorOption func(*HeaderInterceptor)

func NewHeaderInterceptor(opts ...HeaderInterceptorOption) *HeaderInterceptor {
	i := &HeaderInterceptor{}

	for _, opt := range opts {
		opt(i)
	}

	i.interceptor = func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			ctx = ctxHelpers.SetContextRequestHears(ctx, req.Header())
			return next(ctx, req)
		}
	}

	return i
}

func (i *HeaderInterceptor) Interceptor() connect.UnaryInterceptorFunc {
	return i.interceptor
}
