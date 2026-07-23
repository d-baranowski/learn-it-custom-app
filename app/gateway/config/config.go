package config

import (
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/rpg/store"
	"pkg/tracing"
)

type Config struct {
	Name         *base.ServiceName    `validate:"required" envconfig:"SERVICE_NAME" default:"rpg.gateway"`
	Env          *base.ServiceEnv     `validate:"required" envconfig:"SERVICE_ENV" default:"dev"`
	Version      *base.ServiceVersion `validate:"required" envconfig:"SERVICE_VERSION" default:"0.0.1"`
	Logging      *logging.Config      `validate:"required"`
	Tracing      *tracing.Config      `validate:"required"`
	HealthServer *health.Config       `validate:"required"`
	Api          *api.Config          `validate:"required"`
	StoreConfig  *store.Config
	Postgres     *postgres.Config `validate:"required" envconfig:"PG"`

	Backends *Backends `validate:"required"`
}

type Backends struct {
	Core         string `validate:"required" envconfig:"CORE_SERVICE" default:"http://rpg.core"`
	File         string `validate:"required" envconfig:"FILE_SERVICE" default:"http://rpg.file"`
	Payment      string `validate:"required" envconfig:"PAYMENT_SERVICE" default:"http://rpg.payment"`
	Notification string `validate:"required" envconfig:"NOTIFICATION_SERVICE" default:"http://rpg.notification"`
}
