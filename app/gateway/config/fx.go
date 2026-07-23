package config

import (
	"go.uber.org/fx"
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/rpg/store"
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

func ProvideTracingConfig(c *Config) *tracing.Config {
	return c.Tracing
}

func ProvideHealthConfig(c *Config) *health.Config {
	return c.HealthServer
}

func ProvideApiConfig(c *Config) *api.Config {
	return c.Api
}

func ProvideStoreConfig(c *Config) *store.Config {
	return c.StoreConfig
}

func ProvidePostgresConfig(c *Config) *postgres.Config {
	return c.Postgres
}

func ProvideBackends(c *Config) *Backends {
	return c.Backends
}

var Module = fx.Module("config", fx.Provide(
	Provider,
	ProvideName,
	ProvideEnv,
	ProvideVersion,
	ProvideLoggingConfig,
	ProvideTracingConfig,
	ProvideHealthConfig,
	ProvideApiConfig,
	ProvideStoreConfig,
	ProvidePostgresConfig,
	ProvideBackends,
))
