package rabbitmq

import (
	"github.com/rabbitmq/rabbitmq-stream-go-client/pkg/stream"
	"go.uber.org/fx"
	"time"
)

func ApiClientProvider(config *Config) (*ApiClient, error) {
	return NewApiClient(config)
}

func ConnectionProvider(config *Config) (*Connection, error) {
	cfg := AmqpConfig{
		Heartbeat: 0,
	}

	if config.Heartbeat > 0 {
		cfg.Heartbeat = time.Duration(config.Heartbeat) * time.Second
	}

	return NewConnection(config.ConnectionString(), WithConnectionOptionsConfig(cfg))
}

func ConnectionPoolProvider(config *Config) (*ConnectionPool, error) {
	return NewConnectionPool(config)
}

func StreamEnvironmentProvider(config *Config) (*stream.Environment, error) {
	return NewStreamEnvironment(config)
}

var Module = fx.Module("rabbitmq",
	fx.Invoke(
		ConnectionPoolProvider,
	),
	fx.Provide(
		ApiClientProvider,
		ConnectionProvider,
		StreamEnvironmentProvider,
	),
)
