package cdc

import (
	"context"
	"errors"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/cdc/notify"
	"pkg/cdc/wal"
	"pkg/database/postgres"
)

func NotifierProvider(lc fx.Lifecycle, ctx context.Context, config *postgres.Config, log *zap.Logger) (*notify.Service, error) {
	return notify.NewService(lc, ctx, config, log)
}

func WalOutputPluginProvider(c *wal.Config) (*wal.OutputPlugin, error) {
	switch c.OutputPlugin {
	case "pgoutput":
		return &wal.OutputPlugin{
			PluginName: "pgoutput",
			Arguments: []string{
				"proto_version '1'",
				"publication_names '" + c.PublicationName + "'",
				"messages 'true'",
			},
		}, nil

	case "wal2json":
		return &wal.OutputPlugin{
			PluginName: "wal2json",
			Arguments: []string{
				"pretty-print 'true'",
			},
		}, nil

	default:
		return nil, errors.New("invalid output plugin")
	}
}

var Module = fx.Module("cdc",
	fx.Provide(NotifierProvider),
	fx.Provide(WalOutputPluginProvider),
	fx.Provide(wal.RepositoryProvider),
	fx.Provide(wal.ServiceProvider),
)
