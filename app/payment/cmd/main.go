package main

import (
	_api "app/payment/api"
	"app/payment/config"
	"app/payment/db"
	"app/payment/model"
	"app/payment/service"
	"context"
	"database/sql"
	"flag"
	"pkg/api"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgmq"
	"pkg/pgstore"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/sqlcrypt/providers/aesgcm"
	"pkg/tracing"

	_ "go.uber.org/automaxprocs"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
)

func main() {
	ctx := context.Background()

	// go run main.go -migrate=true
	var migrate = flag.Bool("migrate", false, "run migrations")
	flag.Parse()

	if *migrate == true {
		migrator := fx.New(
			fx.Provide(
				func() (context.Context, error) {
					return ctx, nil
				},
			),
			fx.WithLogger(func(log *zap.Logger) fxevent.Logger {
				return &fxevent.ZapLogger{Logger: log}
			}),
			config.Module,
			tracing.Module,
			logging.Module,
			postgres.Module,
			fx.Invoke(
				func(sqlDB *sql.DB, log *zap.Logger, shutdowner fx.Shutdowner) {
					err := db.Migrate(sqlDB)
					if err != nil {
						log.Fatal("failed to migrate", zap.Error(err))
					}
					_ = shutdowner.Shutdown()
				},
			))

		if err := migrator.Start(ctx); err != nil {
			zap.L().Fatal("failed to start migrator", zap.Error(err))
		}

		<-migrator.Done()

		if err := migrator.Stop(ctx); err != nil {
			zap.L().Fatal("failed to stop migrator", zap.Error(err))
		}

		return
	}

	app := fx.New(
		fx.WithLogger(func(log *zap.Logger) fxevent.Logger {
			return &fxevent.ZapLogger{Logger: log}
		}),
		repository.Module,
		config.Module,
		logging.Module,
		tracing.Module,
		pgstore.Module,
		health.Module,
		postgres.Module,
		aesgcm.Module,
		store.Module,
		service.Module,
		model.Module,

		api.Module,
		_api.Module,

		fx.Provide(
			func() (context.Context, error) {
				return ctx, nil
			},
		),

		fx.Provide(fx.Annotate(
			func(cfg *config.Config, log *zap.Logger) pgmq.Publisher {
				if !cfg.PgmqEnabled {
					return nil
				}
				return pgmq.NewPublisher("payment", log)
			},
			fx.ResultTags(`optional:"true"`),
		)),
	)

	if err := app.Start(ctx); err != nil {
		zap.L().Fatal("failed to start application", zap.Error(err))
	}

	<-app.Done()

	if err := app.Stop(ctx); err != nil {
		zap.L().Fatal("failed to stop application", zap.Error(err))
	}
}
