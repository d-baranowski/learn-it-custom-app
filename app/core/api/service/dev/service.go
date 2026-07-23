package dev

import (
	"app/core/config"
	"app/core/db"
	devv1 "app/core/gen/core/dev/v1"
	"app/core/gen/core/dev/v1/devv1connect"
	"context"
	"database/sql"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"
	"sync"

	"connectrpc.com/connect"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

type Service struct {
	sqlDB      *sql.DB
	log        *zap.Logger
	config     *config.Config
	viewEngine *repository.ViewEngine
	resetMu    sync.Mutex
}

type ServiceProviderProps struct {
	fx.In

	ApiServer  *api.Server
	SqlDB      *sql.DB
	Log        *zap.Logger
	Config     *config.Config
	ViewEngine *repository.ViewEngine
}

func ServiceProvider(props ServiceProviderProps) error {
	if !props.Config.EnableDevAPI {
		props.Log.Info("DEV_API mode is disabled, skipping dev service registration")
		return nil
	}

	props.Log.Info("DEV_API mode is ENABLED, registering dev service")

	s := &Service{
		sqlDB:      props.SqlDB,
		log:        props.Log.Named("dev"),
		config:     props.Config,
		viewEngine: props.ViewEngine,
	}

	tracer := tracing.NewTracer("api.devService")
	_ = tracer

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := devv1connect.NewDevServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *Service) ResetDatabase(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[devv1.ResetDatabaseResponse], error) {
	s.resetMu.Lock()
	defer s.resetMu.Unlock()

	s.log.Info("ResetDatabase called - dropping all tables")

	// Terminate other backends holding locks on core schema objects —
	// without this, DROP SCHEMA blocks until those queries finish or
	// their connections close, which can take minutes.
	_, _ = s.sqlDB.ExecContext(ctx, `
		SELECT pg_terminate_backend(pid)
		FROM pg_stat_activity
		WHERE pid <> pg_backend_pid()
		  AND datname = current_database()
	`)

	_, err := s.sqlDB.ExecContext(ctx, "DROP SCHEMA IF EXISTS core CASCADE; CREATE SCHEMA core;")
	if err != nil {
		s.log.Error("failed to drop schema", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	_, err = s.sqlDB.ExecContext(ctx, "DROP TABLE IF EXISTS public.core_db_version CASCADE;")
	if err != nil {
		s.log.Error("failed to drop migration versions", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	_, err = s.sqlDB.ExecContext(ctx, "DROP TABLE IF EXISTS public.core_version CASCADE;")
	if err != nil {
		s.log.Error("failed to drop migration versions", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	s.log.Info("Schema dropped, running migrations")

	// Run migrations
	err = db.Migrate(s.sqlDB)
	if err != nil {
		s.log.Error("failed to run migrations", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	s.log.Info("Migrations completed successfully")

	s.viewEngine.ClearInitialised()

	return connect.NewResponse(&devv1.ResetDatabaseResponse{
		Success: true,
		Message: "Database reset successfully. Ready for bootstrap data.",
	}), nil
}
