package main

import (
	"app/core-event/config"
	"app/core-event/db"
	"app/core-event/transform"
	"context"
	"database/sql"
	"flag"
	"pkg/cdc"
	"pkg/cdc/wal"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgstore"
	"pkg/tracing"

	"github.com/uptrace/bun"
	_ "go.uber.org/automaxprocs"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"go.uber.org/zap"
)

func provideFilter(cfg *wal.Config) (*wal.Filter, error) {
	return wal.LoadFilterConfig(cfg.FilterFile)
}

func provideTransformRegistry(db *bun.DB, log *zap.Logger) *transform.Registry {
	r := transform.NewRegistry(log)
	r.Register("core.session", transform.NewSessionTransformer(db, log))
	r.Register("core.therapist", transform.NewTherapistTransformer(db, log))
	return r
}

func provideEventPublisher(filter *wal.Filter, registry *transform.Registry, db *bun.DB, log *zap.Logger) wal.EventPublisher {
	return newPgmqPublisher(filter, registry, db, log)
}

func main() {
	ctx := context.Background()

	migrate := flag.Bool("migrate", false, "run migrations")
	flag.Parse()

	if *migrate {
		migrator := fx.New(
			fx.Provide(func() (context.Context, error) {
				return ctx, nil
			}),
			fx.WithLogger(func(log *zap.Logger) fxevent.Logger {
				return &fxevent.ZapLogger{Logger: log}
			}),
			config.Module,
			tracing.Module,
			logging.Module,
			postgres.Module,
			fx.Invoke(func(sqlDB *sql.DB, log *zap.Logger, shutdowner fx.Shutdowner) {
				if err := db.Migrate(sqlDB); err != nil {
					log.Fatal("failed to migrate", zap.Error(err))
				}
				_ = shutdowner.Shutdown()
			}),
		)

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
		config.Module,
		logging.Module,
		tracing.Module,
		pgstore.Module,
		health.Module,
		postgres.Module,
		fx.Provide(func() (context.Context, error) {
			return ctx, nil
		}),
		fx.Provide(cdc.WalOutputPluginProvider),
		fx.Provide(wal.RepositoryProvider),
		fx.Provide(provideFilter),
		fx.Provide(provideTransformRegistry),
		fx.Provide(provideEventPublisher),
		fx.Invoke(wal.ServiceProvider),
	)

	if err := app.Start(ctx); err != nil {
		zap.L().Fatal("failed to start application", zap.Error(err))
	}

	<-app.Done()

	if err := app.Stop(ctx); err != nil {
		zap.L().Fatal("failed to stop application", zap.Error(err))
	}
}
