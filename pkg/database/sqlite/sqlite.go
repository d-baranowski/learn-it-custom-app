package sqlite

import (
	"database/sql"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"go.uber.org/zap"
	"pkg/logging"
	"time"
)

type Database struct {
	DB    *bun.DB
	SqlDB *sql.DB
}

func NewMemorySqliteDatabase(name string, withDriverName bool) (*Database, error) {
	config := NewSqliteConfig()
	config.FileName = name
	config.Mode = "memory"
	config.Cache = "shared"

	if withDriverName {
		config.DriverName = name
	}

	db, err := NewSqliteDatabase(config)
	if err != nil {
		return nil, err
	}

	db.SqlDB.SetMaxIdleConns(1000)
	db.SqlDB.SetConnMaxLifetime(0)

	return db, nil
}

func NewSqliteDatabase(config *Config) (*Database, error) {
	driverName := sqliteshim.ShimName
	if config.DriverName != "" {
		driverName = config.DriverName
	}
	sqlDB, err := sql.Open(driverName, config.Dsn())
	if err != nil {
		return nil, err
	}

	db := bun.NewDB(sqlDB, sqlitedialect.New())
	db.AddQueryHook(logging.NewQueryHook(logging.QueryHookOptions{
		Logger:       zap.L(),
		SlowDuration: 200 * time.Millisecond,
	}))

	return &Database{
		DB:    db,
		SqlDB: sqlDB,
	}, nil
}

// NewSqliteDatabaseFromSqlDriver creates a new SqliteDatabase from an existing sql.db
//
//	 sql.Register("router",
//			&sqlite3.SQLiteDriver{
//				ConnectHook: func(conn *sqlite3.SQLiteConn) error {
//					err = conn.RegisterFunc("eval_route_tags", tag.SqliteHook, true)
//					if err != nil {
//						return err
//					}
//
//					err = conn.RegisterFunc("eval_route_tod", props.TodService.SqliteHook, true)
//					if err != nil {
//						return err
//					}
//
//					return nil
//				},
//			})
//
//		sqlDB, err := sql.Open("router", props.Config.Sqlite.Dsn())
//		if err != nil {
//			return nil, err
//		}
//
//		s.sqlite, err = database.NewSqliteDatabaseFromSqlDriver(
//			sqlDB,
//			"router",
//			database.NewSqliteConfig())
//		if err != nil {
//			return nil, err
//		}

//func NewSqliteDatabaseFromSqlDriver(sqlDB *sql.db, driverName string, props *Config, log *zap.Logger) (*Database, error) {
//	logger := logging.NewGormZapLogger(log)
//	db, err := gorm.Open(sqlite.Dialector{
//		DriverName: driverName,
//		DSN:        props.Dsn(),
//		Connection:       sqlDB,
//	}, &gorm.Config{
//		Logger:          logger,
//		CreateBatchSize: 1000,
//	})
//	if err != nil {
//		log.Error("failed to create database")
//		return nil, err
//	}
//
//	return &Database{
//		db: db,
//	}, nil
//}
