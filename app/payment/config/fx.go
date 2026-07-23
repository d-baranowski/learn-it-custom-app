package config

import (
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgstore"
	"pkg/rabbitmq"
	"pkg/redis"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"

	"go.uber.org/fx"
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

func ProvidePgStoreConfig(c *Config) *pgstore.Config {
	return c.PgStore
}

func ProvideHealthConfig(c *Config) *health.Config {
	return c.HealthServer
}

func ProvidePostgresConfig(c *Config) *postgres.Config {
	return c.Postgres
}

func ProvideRabbitMQConfig(c *Config) *rabbitmq.Config {
	return c.RabbitMQ
}

func ProvideRedisConfig(c *Config) *redis.Config {
	return c.Redis
}

func ProvideApiConfig(c *Config) *api.Config {
	return c.ApiConfig
}

func ProvideStoreConfig(c *Config) *store.Config {
	return c.StoreConfig
}

func ProvideRepositoryConfig(c *Config) *repository.Config {
	return c.RepositoryConfig
}

func ProvideStripeConfig(c *Config) *StripeConfig {
	return c.StripeConfig
}

var Module = fx.Module("config", fx.Provide(
	Provider,
	ProvideApiConfig,
	ProvideEnv,
	ProvidePgStoreConfig,
	ProvideHealthConfig,
	ProvideLoggingConfig,
	ProvideName,
	ProvidePostgresConfig,
	ProvideRabbitMQConfig,
	ProvideRedisConfig,
	ProvideStoreConfig,
	ProvideTracingConfig,
	ProvideVersion,
	ProvideRepositoryConfig,
	ProvideStripeConfig,
))
