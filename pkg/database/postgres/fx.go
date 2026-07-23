package postgres

import (
	"database/sql"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/schema"
	"go.uber.org/fx"
)

func BunDBProvider(conn *Connection) (*bun.DB, error) {
	return conn.DB, nil
}

func SqlDBProvider(conn *Connection) (*sql.DB, error) {
	return conn.SqlDB, nil
}

func BunTablesProvider(dialect schema.Dialect) (*schema.Tables, error) {
	return schema.NewTables(dialect), nil
}

func DialectProvider() (schema.Dialect, error) {
	return pgdialect.New(), nil
}

//func ConnectionProvider(lc fx.Lifecycle, config *Config, serviceName *base.ServiceName, log *zap.Logger) (*Connection, error) {
//	return NewFXPostgresConnection(lc, config, serviceName, log)
//}

//func PgConnectionProvider(ctx context.Context, lc fx.Lifecycle, config *Config, log *zap.Logger) (*pgconn.PgConn, error) {
//	return NewPgConnection(ctx, lc, config, log)
//}

//func PgxConnectionProvider(ctx context.Context, lc fx.Lifecycle, config *Config, log *zap.Logger) (*pgx.Connection, error) {
//	return NewPgxConnection(ctx, lc, config, log)
//}

//func PgxPoolProvider(ctx context.Context, lc fx.Lifecycle, config *Config, log *zap.Logger) (*pgxpool.Pool, error) {
//	return NewPgxPool(ctx, lc, config, log)
//}

// Module provided to fx
var Module = fx.Module("postgres",
	fx.Provide(BunDBProvider),
	fx.Provide(SqlDBProvider),
	fx.Provide(ConnectionProvider),
	//fx.Provide(PooledConnectionProvider),
	fx.Provide(PgConnectionProvider),
	fx.Provide(PgxConnectionProvider),
	fx.Provide(PgxPoolProvider),
	fx.Provide(BunTablesProvider),
	fx.Provide(DialectProvider),
	fx.Invoke(RegisterPoolMetrics),
)
