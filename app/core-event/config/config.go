package config

import (
	"pkg/base"
	"pkg/cdc/wal"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgstore"
	"pkg/tracing"
)

type Config struct {
	Name         *base.ServiceName    `validate:"required" envconfig:"SERVICE_NAME" default:"rpg.core-event"`
	Env          *base.ServiceEnv     `validate:"required" envconfig:"SERVICE_ENV" default:"dev"`
	Version      *base.ServiceVersion `validate:"required" envconfig:"SERVICE_VERSION" default:"0.0.1"`
	Logging      *logging.Config      `validate:"required"`
	Tracing      *tracing.Config      `validate:"required"`
	PgStore      *pgstore.Config      `validate:"required"`
	HealthServer *health.Config       `validate:"required"`
	Postgres     *postgres.Config     `validate:"required" envconfig:"PG"`
	Wal          *wal.Config          `validate:"required" envconfig:"WAL"`
}
