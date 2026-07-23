package config

import (
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/tracing"
)

type Config struct {
	Name         *base.ServiceName    `validate:"required" envconfig:"SERVICE_NAME" default:"rpg-bootstrap"`
	Env          *base.ServiceEnv     `validate:"required" envconfig:"SERVICE_ENV" default:"dev"`
	Version      *base.ServiceVersion `validate:"required" envconfig:"SERVICE_VERSION" default:"0.0.1"`
	Logging      *logging.Config      `validate:"required"`
	HealthServer *health.Config       `validate:"required"`
	Postgres     *postgres.Config     `validate:"required" envconfig:"PG"`
	Tracing      *tracing.Config      `validate:"required"`
	EnableDevAPI bool                 `envconfig:"ENABLE_DEV_API" default:"false"`
	// SeedE2ESessions seeds fixed long-lived auth sessions for the E2E suite so
	// Cypress can inject the auth cookie and skip the login UI. Off by default —
	// must never be enabled in production.
	SeedE2ESessions    bool   `envconfig:"SEED_E2E_SESSIONS" default:"false"`
	CoreAPIURL         string `envconfig:"CORE_API_URL" default:"http://localhost:9102"`
	NotificationAPIURL string `envconfig:"NOTIFICATION_API_URL" default:"http://localhost:9002"`
	BootstrapAPIPort   int    `envconfig:"BOOTSTRAP_API_PORT" default:"8080"`
}
