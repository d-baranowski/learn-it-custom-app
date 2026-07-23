package config

import (
	"pkg/base"
	"pkg/cdc/wal"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgstore"
	"pkg/tracing"

	"go.uber.org/fx"
)

func Provider() *Config {
	return base.ConfigReader[Config](Config{})
}

func ProvideName(c *Config) *base.ServiceName        { return c.Name }
func ProvideEnv(c *Config) *base.ServiceEnv          { return c.Env }
func ProvideVersion(c *Config) *base.ServiceVersion  { return c.Version }
func ProvideLoggingConfig(c *Config) *logging.Config  { return c.Logging }
func ProvideTracingConfig(c *Config) *tracing.Config  { return c.Tracing }
func ProvidePgStoreConfig(c *Config) *pgstore.Config  { return c.PgStore }
func ProvideHealthConfig(c *Config) *health.Config    { return c.HealthServer }
func ProvidePostgresConfig(c *Config) *postgres.Config { return c.Postgres }
func ProvideWalConfig(c *Config) *wal.Config          { return c.Wal }

var Module = fx.Module("config", fx.Provide(
	Provider,
	ProvideName,
	ProvideEnv,
	ProvideVersion,
	ProvideLoggingConfig,
	ProvideTracingConfig,
	ProvidePgStoreConfig,
	ProvideHealthConfig,
	ProvidePostgresConfig,
	ProvideWalConfig,
))
