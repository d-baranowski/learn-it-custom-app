package postgres

import (
	"context"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"strings"
)

func PgConnectionProvider(ctx context.Context, _ fx.Lifecycle, config *Config, log *zap.Logger) (*pgconn.PgConn, error) {
	cs := config.ConnectionString() + "&replication=database"
	conn, err := pgconn.Connect(ctx, cs)
	if err != nil {
		log.Error("failed to connect to postgres", zap.Error(err))
		return nil, err
	}

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		log.Info("closing postgres connection")
	//		return conn.Close(ctx)
	//	},
	//})

	return conn, nil
}

func PgxConnectionProvider(ctx context.Context, _ fx.Lifecycle, config *Config, log *zap.Logger) (*pgx.Conn, error) {
	pgxConf, err := pgx.ParseConfig(config.ConnectionString())
	if err != nil {
		log.Error("failed to parse postgres connection string", zap.Error(err))
		return nil, err
	}

	//pgxConf.tracer = logging.NewPgxQueryTracer(log.Sugar())

	pgxConn, err := pgx.ConnectConfig(ctx, pgxConf)
	if err != nil {
		log.Error("failed to connect to postgres", zap.Error(err))
		return nil, err
	}

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		log.Info("closing postgres connection")
	//		return pgxConn.Close(ctx)
	//	},
	//})

	return pgxConn, nil
}

func PgxPoolProvider(ctx context.Context, _ fx.Lifecycle, config *Config, log *zap.Logger) (*pgxpool.Pool, error) {
	// Must use parse config see: https://github.com/jackc/pgx/issues/588
	pgxConf, _ := pgxpool.ParseConfig("")
	pgxConf.ConnConfig.Host = config.Host
	pgxConf.ConnConfig.Port = config.Port
	pgxConf.ConnConfig.Database = config.DbName
	// Trim whitespace from user and password to avoid authentication issues
	pgxConf.ConnConfig.User = strings.TrimSpace(config.User)
	pgxConf.ConnConfig.Password = strings.TrimSpace(config.Password)

	if config.SearchPath != "" {
		pgxConf.ConnConfig.RuntimeParams["search_path"] = config.SearchPath
	}

	//pgxConf.ConnConfig.tracer = logging.NewPgxQueryTracer(log.Sugar())

	pgxPool, err := pgxpool.NewWithConfig(ctx, pgxConf)
	if err != nil {
		log.Error("failed to connect to postgres", zap.Error(err))
		return nil, err
	}

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		log.Info("closing postgres connection")
	//		pgxPool.Close()
	//		return nil
	//	},
	//})

	return pgxPool, nil
}
