package config

import (
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgmq"
	"pkg/pgstore"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"

	"go.uber.org/fx"
)

func Provider() *Config {
	return base.ConfigReader[Config](Config{})
}

func ProvideName(c *Config) *base.ServiceName              { return c.Name }
func ProvideEnv(c *Config) *base.ServiceEnv                { return c.Env }
func ProvideVersion(c *Config) *base.ServiceVersion        { return c.Version }
func ProvideLoggingConfig(c *Config) *logging.Config       { return c.Logging }
func ProvideTracingConfig(c *Config) *tracing.Config       { return c.Tracing }
func ProvidePgStoreConfig(c *Config) *pgstore.Config       { return c.PgStore }
func ProvideHealthConfig(c *Config) *health.Config         { return c.HealthServer }
func ProvidePostgresConfig(c *Config) *postgres.Config     { return c.Postgres }
func ProvideApiConfig(c *Config) *api.Config               { return c.ApiConfig }
func ProvideStoreConfig(c *Config) *store.Config           { return c.StoreConfig }
func ProvideRepositoryConfig(c *Config) *repository.Config { return c.RepositoryConfig }
func ProvideEmailConfig(c *Config) *EmailConfig {
	return c.EmailConfig
}

func ProvideSmsConfig(c *Config) *SmsConfig {
	return c.SmsConfig
}

func ProvideDispatchConfig(c *Config) *NotificationDispatchConfig {
	return c.Dispatch
}

func ProvidePublicWebhookURL(c *Config) PublicWebhookURL {
	return PublicWebhookURL(c.PublicWebhookURL)
}

func ProvideEventConsumerConfig(c *Config) *pgmq.ConsumerConfig {
	return c.EventConsumer
}

func ProvideReminderConfig(c *Config) *ReminderConfig {
	return c.Reminder
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
	ProvideStoreConfig,
	ProvideTracingConfig,
	ProvideVersion,
	ProvideRepositoryConfig,
	ProvideEmailConfig,
	ProvideSmsConfig,
	ProvideDispatchConfig,
	ProvidePublicWebhookURL,
	ProvideEventConsumerConfig,
	ProvideReminderConfig,
))
