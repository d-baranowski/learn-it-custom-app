package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"pkg/logging"
	"pkg/tracing"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/extra/bundebug"
	"github.com/uptrace/bun/extra/bunotel"
	"github.com/uptrace/bun/schema"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Connection struct {
	DB    *bun.DB
	SqlDB *sql.DB
}

func (c *Connection) Close() error {
	return c.SqlDB.Close()
}

type bunFileLogger struct {
	savePath string
	log      *zap.Logger
}

func (b *bunFileLogger) BeforeQuery(ctx context.Context, event *bun.QueryEvent) context.Context {
	return ctx
}

func (b *bunFileLogger) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
	// Get the directory path from the file path
	dirPath := filepath.Dir(b.savePath)

	// Check if the directory exists
	_, err := os.Stat(dirPath)
	if os.IsNotExist(err) {
		// Create the directory if it doesn't exist
		err = os.MkdirAll(dirPath, 0755)
		if err != nil {
			b.log.Error("Error creating directory", zap.Error(err))
			return
		}
	}

	// Open the file in append mode
	file, err := os.OpenFile(b.savePath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		b.log.Error("Error opening file:", zap.Error(err))
		return
	}
	defer file.Close()

	// Append the string to the file
	duration := time.Now().Sub(event.StartTime).String()
	sqlQuery := duration + ": " + event.Query
	// Remove newlines and multiple whitespaces
	formattedQuery := strings.ReplaceAll(sqlQuery, "\n", " ")
	re := regexp.MustCompile(`\s+`)
	formattedQuery = re.ReplaceAllString(formattedQuery, " ")
	formattedQuery = strings.TrimSpace(formattedQuery)

	_, err = fmt.Fprintln(file, formattedQuery)
	if err != nil {
		return
	}
}

func ConnectionProvider(_ fx.Lifecycle, config *Config, log *zap.Logger, dialect schema.Dialect) (*Connection, error) {
	c := &Connection{}

	pgxConfig, err := pgx.ParseConfig(config.GetDSN(false))
	if err != nil {
		log.Error("failed to parse pgx config", zap.Error(err))
		return nil, err
	}
	//pgxConfig.PreferSimpleProtocol = true

	sqlDB := stdlib.OpenDB(*pgxConfig)

	sqlDB.SetMaxIdleConns(config.MaxIdleConnections)
	sqlDB.SetMaxOpenConns(config.MaxOpenConnections)
	sqlDB.SetConnMaxLifetime(time.Duration(config.MaxConnLifetime) * time.Second)
	// Recycles connections that sit unused in the pool. ConnMaxLifetime alone is
	// not enough: it only applies to connections RETURNED to the pool, so one
	// checked out inside an open transaction is never eligible — which is why
	// the 2026-07-29 leak outlived its 1h lifetime. Pairs with Aurora's
	// idle_session_timeout, and is kept below it so the client closes first.
	sqlDB.SetConnMaxIdleTime(time.Duration(config.MaxConnIdleTime) * time.Second)

	c.SqlDB = sqlDB

	bunDB := bun.NewDB(sqlDB, dialect)

	bunDB.AddQueryHook(logging.NewQueryHook(logging.QueryHookOptions{
		Logger:       log,
		SlowDuration: 200 * time.Millisecond, // Omit to log all operations as debug
	}))
	if config.LogLevel == "debug" {
		bunDB.AddQueryHook(logging.NewDebugQueryHook(false, false, true))
	}
	if config.Trace {
		bunDB.AddQueryHook(tracing.NewBunQueryHook("ump-postgres", false))
	}

	if config.SaveQueryFilePath != nil {
		bunDB.AddQueryHook(&bunFileLogger{
			savePath: *config.SaveQueryFilePath,
			log:      log,
		})
	}

	c.DB = bunDB

	log.Info("connected to postgres", zap.String("dsn", config.GetDSN(true)))

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		log.Info("closing postgres connection")
	//		return c.SqlDB.Close()
	//	},
	//})

	return c, nil
}

// PooledConnectionProvider is WIP, do not use
func PooledConnectionProvider(ctx context.Context, _ fx.Lifecycle, config *Config, log *zap.Logger) (*Connection, error) {
	c := &Connection{}

	pgxConf, _ := pgxpool.ParseConfig("")
	pgxConf.ConnConfig.Host = config.Host
	pgxConf.ConnConfig.Port = config.Port
	pgxConf.ConnConfig.Database = config.DbName
	pgxConf.ConnConfig.User = config.User
	pgxConf.ConnConfig.Password = config.Password

	if config.SearchPath != "" {
		pgxConf.ConnConfig.RuntimeParams["search_path"] = config.SearchPath
	}

	pgxPool, err := pgxpool.NewWithConfig(ctx, pgxConf)
	if err != nil {
		log.Error("failed to connect to postgres", zap.Error(err))
		return nil, err
	}

	sqlDB := stdlib.OpenDBFromPool(pgxPool)

	sqlDB.SetMaxIdleConns(config.MaxIdleConnections)
	sqlDB.SetMaxOpenConns(config.MaxOpenConnections)
	sqlDB.SetConnMaxLifetime(time.Duration(config.MaxConnLifetime) * time.Second)
	// Recycles connections that sit unused in the pool. ConnMaxLifetime alone is
	// not enough: it only applies to connections RETURNED to the pool, so one
	// checked out inside an open transaction is never eligible — which is why
	// the 2026-07-29 leak outlived its 1h lifetime. Pairs with Aurora's
	// idle_session_timeout, and is kept below it so the client closes first.
	sqlDB.SetConnMaxIdleTime(time.Duration(config.MaxConnIdleTime) * time.Second)

	c.SqlDB = sqlDB

	bunDB := bun.NewDB(sqlDB, pgdialect.New())

	bunDB.AddQueryHook(logging.NewQueryHook(logging.QueryHookOptions{
		Logger:       log,
		SlowDuration: 200 * time.Millisecond, // Omit to log all operations as debug
	}))
	if config.LogLevel == "debug" {
		bunDB.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}
	if config.Trace {
		bunDB.AddQueryHook(bunotel.NewQueryHook(bunotel.WithDBName("ump-postgres")))
	}

	c.DB = bunDB

	log.Info("connected to postgres", zap.String("dsn", config.GetDSN(true)))

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		log.Info("closing postgres connection")
	//		return c.SqlDB.Close()
	//	},
	//})

	return c, nil
}

func NewPostgresConnection(config *Config) (*Connection, error) {
	c := &Connection{}

	sqlDB, err := sql.Open("pgx", config.GetDSN(false))
	if err != nil {
		zap.L().Error("failed to connect to postgres", zap.Error(err))
	}

	sqlDB.SetMaxIdleConns(config.MaxIdleConnections)
	sqlDB.SetMaxOpenConns(config.MaxOpenConnections)
	sqlDB.SetConnMaxLifetime(time.Duration(config.MaxConnLifetime) * time.Second)
	// Recycles connections that sit unused in the pool. ConnMaxLifetime alone is
	// not enough: it only applies to connections RETURNED to the pool, so one
	// checked out inside an open transaction is never eligible — which is why
	// the 2026-07-29 leak outlived its 1h lifetime. Pairs with Aurora's
	// idle_session_timeout, and is kept below it so the client closes first.
	sqlDB.SetConnMaxIdleTime(time.Duration(config.MaxConnIdleTime) * time.Second)

	c.SqlDB = sqlDB

	bunDB := bun.NewDB(sqlDB, pgdialect.New())

	bunDB.AddQueryHook(logging.NewQueryHook(logging.QueryHookOptions{
		Logger:       zap.L(),
		SlowDuration: 200 * time.Millisecond, // Omit to log all operations as debug
	}))
	if config.LogLevel == "debug" {
		bunDB.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	c.DB = bunDB

	zap.L().Info("connected to postgres", zap.String("dsn", config.GetDSN(true)))

	return c, nil
}
