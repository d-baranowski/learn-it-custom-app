package service

import (
	"context"
	"net/http"
	"time"

	"app/notification/config"
	corev1connect "app/core/gen/core/v1/corev1connect"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
)

func serviceModeInterceptor(serviceName string) connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			if req.Spec().IsClient {
				req.Header().Set(ctxHelpers.XRequestMode, ctxHelpers.RequestModeService)
				req.Header().Set(ctxHelpers.XUserID, serviceName)
			}
			return next(ctx, req)
		}
	}
}

func CoreSessionClientProvider(cfg *config.Config) corev1connect.SessionServiceClient {
	if cfg.CoreServiceURL == "" {
		return nil
	}
	interceptors := connect.WithInterceptors(serviceModeInterceptor("notification-service"))
	httpClient := &http.Client{Timeout: 10 * time.Second}
	return corev1connect.NewSessionServiceClient(httpClient, cfg.CoreServiceURL, interceptors)
}
