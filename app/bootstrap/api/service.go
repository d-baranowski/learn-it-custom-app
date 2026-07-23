package api

import (
	"app/bootstrap/config"
	bootstrapv1 "app/bootstrap/gen/bootstrap/v1"
	"app/bootstrap/gen/bootstrap/v1/bootstrapv1connect"
	"app/bootstrap/service/bootstrap"
	"bytes"
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/protobuf/types/known/emptypb"
)

type Service struct {
	config           *config.Config
	log              *zap.Logger
	bootstrapService bootstrap.Service
	httpServer       *http.Server
	resetMu          sync.Mutex
}

type ServiceProps struct {
	fx.In

	Config           *config.Config
	Log              *zap.Logger
	BootstrapService bootstrap.Service
}

func ServiceProvider(lc fx.Lifecycle, props ServiceProps) (*Service, error) {
	if !props.Config.EnableDevAPI {
		props.Log.Info("DEV_API mode is disabled, skipping bootstrap API service")
		return nil, nil
	}

	props.Log.Info("DEV_API mode is ENABLED, starting bootstrap API service")

	s := &Service{
		config:           props.Config,
		log:              props.Log.Named("bootstrap-api"),
		bootstrapService: props.BootstrapService,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return s.Start()
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop()
		},
	})

	return s, nil
}

func (s *Service) Start() error {
	mux := http.NewServeMux()

	otelInterceptor, err := otelconnect.NewInterceptor(otelconnect.WithTrustRemote())
	if err != nil {
		return err
	}

	path, handler := bootstrapv1connect.NewBootstrapServiceHandler(s, connect.WithInterceptors(otelInterceptor))
	mux.Handle(path, handler)

	addr := fmt.Sprintf(":%d", s.config.BootstrapAPIPort)
	s.httpServer = &http.Server{
		Addr:    addr,
		Handler: h2c.NewHandler(mux, &http2.Server{}),
	}

	go func() {
		s.log.Info("Bootstrap API server starting", zap.String("addr", addr))
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.log.Error("Bootstrap API server failed", zap.Error(err))
		}
	}()

	return nil
}

func (s *Service) Stop() error {
	if s.httpServer != nil {
		return s.httpServer.Close()
	}
	return nil
}

func (s *Service) ResetDatabase(ctx context.Context, _ *connect.Request[emptypb.Empty]) (*connect.Response[bootstrapv1.ResetDatabaseResponse], error) {
	s.resetMu.Lock()
	defer s.resetMu.Unlock()

	s.log.Info("ResetDatabase called - calling core API to reset database")

	ctx, cancel := context.WithTimeout(ctx, 120*time.Second)
	defer cancel()

	coreAPIURL := fmt.Sprintf("%s/core.dev.v1.DevService/ResetDatabase", s.config.CoreAPIURL)
	notificationAPIURL := fmt.Sprintf("%s/notification.dev.v1.DevService/ResetDatabase", s.config.NotificationAPIURL)

	client := &http.Client{Timeout: 60 * time.Second}

	emptyJSONBody := []byte("{}")
	httpReq, err := http.NewRequestWithContext(ctx, "POST", coreAPIURL, bytes.NewReader(emptyJSONBody))
	if err != nil {
		s.log.Error("failed to create request to core API", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("X-Request-Mode", "service")
	httpReq.Header.Set("X-User-Id", "bootstrap-service")

	coreResp, err := client.Do(httpReq)
	if err != nil {
		s.log.Error("failed to call core API", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	defer func() { _ = coreResp.Body.Close() }()

	if coreResp.StatusCode != http.StatusOK {
		s.log.Error("core API returned error", zap.Int("status", coreResp.StatusCode))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("core API returned status %d", coreResp.StatusCode))
	}

	s.log.Info("Core API reset successful, running bootstrap")

	// Call notification API to reset database (best-effort — service may not be running)
	notifReq, err := http.NewRequestWithContext(ctx, "POST", notificationAPIURL, bytes.NewReader(emptyJSONBody))
	if err != nil {
		s.log.Error("failed to create request to notification API", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	notifReq.Header.Set("Content-Type", "application/json")
	notifReq.Header.Set("Accept", "application/json")
	notifReq.Header.Set("X-Request-Mode", "service")
	notifReq.Header.Set("X-User-Id", "bootstrap-service")

	notifResp, err := client.Do(notifReq)
	if err != nil {
		s.log.Warn("notification API unreachable, skipping notification reset", zap.Error(err))
	} else {
		defer func() { _ = notifResp.Body.Close() }()
		if notifResp.StatusCode != http.StatusOK {
			s.log.Warn("notification API returned error, skipping", zap.Int("status", notifResp.StatusCode))
		} else {
			s.log.Info("Notification API reset successful")
		}
	}

	// Run bootstrap to restore data
	err = s.bootstrapService.Run(ctx)
	if err != nil {
		s.log.Error("failed to run bootstrap", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	s.log.Info("Bootstrap completed successfully")

	return connect.NewResponse(&bootstrapv1.ResetDatabaseResponse{
		Success: true,
		Message: "Database reset and bootstrap completed successfully",
	}), nil
}
