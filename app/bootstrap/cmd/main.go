package main

import (
	"app/bootstrap/api"
	"app/bootstrap/config"
	"app/bootstrap/service/bootstrap"
	"context"

	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
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

		bootstrap.Module,

		fx.Provide(
			func() (context.Context, error) {
				return ctx, nil
			},
		),
		fx.Invoke(
			registerHooks,
		),
		fx.Invoke(
			api.ServiceProvider,
		),
		fx.Invoke(func(_ *health.Server) {}),
	)

	if err := app.Start(ctx); err != nil {
		zap.L().Fatal("failed to start application", zap.Error(err))
	}

	<-app.Done()

	if err := app.Stop(ctx); err != nil {
		zap.L().Fatal("failed to stop application", zap.Error(err))
	}
}

type HookProps struct {
	fx.In

	Config     *config.Config
	Bootstrap  bootstrap.Service
	Shutdowner fx.Shutdowner
}

func registerHooks(lifecycle fx.Lifecycle, props HookProps, log *zap.Logger) {
	lifecycle.Append(
		fx.Hook{
			OnStart: func(ctx context.Context) error {
				log.With(zap.Any("options", props.Config)).Info("starting with options")

				// If DEV_API mode is enabled, don't run bootstrap immediately
				// Instead, wait for API calls
				if props.Config.EnableDevAPI {
					log.Info("DEV_API mode enabled, bootstrap will run on API call")
					return nil
				}

				// Run bootstrap immediately in non-API mode
				bootstrapErr := props.Bootstrap.Run(ctx)
				if bootstrapErr != nil {
					log.Error("failed to bootstrap", zap.Error(bootstrapErr))
					return bootstrapErr
				}

				return props.Shutdowner.Shutdown()
			},
			OnStop: func(ctx context.Context) error {
				return nil
			},
		},
	)
}
