package config

import (
	"go.uber.org/fx"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/tracing"
)

func Provider() *Config {
	opts := base.ConfigReader[Config](Config{})
	return opts
}

func ProvideName(c *Config) *base.ServiceName {
	return c.Name
}

func ProvideEnv(c *Config) *base.ServiceEnv {
	return c.Env
}

func ProvideVersion(c *Config) *base.ServiceVersion {
	return c.Version
}

func ProvideLoggingConfig(c *Config) *logging.Config {
	return c.Logging
}

func ProvideHealthConfig(c *Config) *health.Config {
	return c.HealthServer
}

func ProvidePostgresConfig(c *Config) *postgres.Config {
	return c.Postgres
}
func ProvideTracingConfig(c *Config) *tracing.Config {
	return c.Tracing
}

var Module = fx.Module("config", fx.Provide(
	ProvideEnv,
	ProvideHealthConfig,
	ProvideLoggingConfig,
	ProvideName,
	ProvidePostgresConfig,
	ProvideVersion,
	Provider,
	ProvideTracingConfig,
))
