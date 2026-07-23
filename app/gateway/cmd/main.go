package main

import (
	_api "app/gateway/api"
	"app/gateway/config"
	"app/gateway/service"
	"context"
	_ "go.uber.org/automaxprocs"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
	"pkg/api"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/rpg/store"
	"pkg/sqlcrypt/providers/aesgcm"
	"pkg/tracing"
)

func main() {
	ctx := context.Background()

	app := fx.New(
		fx.WithLogger(func(log *zap.Logger) fxevent.Logger {
			return &fxevent.ZapLogger{Logger: log}
		}),
		config.Module,
		logging.Module,
		tracing.Module,
		health.Module,
		postgres.Module,
		aesgcm.Module,
		store.Module,
		api.Module,
		_api.Module,

		fx.Provide(
			service.GatewayServiceProvider,
			func() (context.Context, error) {
				return ctx, nil
			},
		),
	)

	if err := app.Start(ctx); err != nil {
		zap.L().Fatal("failed to start application", zap.Error(err))
	}

	<-app.Done()

	if err := app.Stop(ctx); err != nil {
		zap.L().Fatal("failed to stop application", zap.Error(err))
	}
}
