package mysql

import (
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/base"
)

func ConnectionProvider(lc fx.Lifecycle, config *Config, serviceName *base.ServiceName, log *zap.Logger) (*Connection, error) {
	return NewMysqlConnection(lc, config, serviceName, log)
}

// Module provided to fx
var Module = fx.Module("mysql",
	fx.Provide(ConnectionProvider),
)
