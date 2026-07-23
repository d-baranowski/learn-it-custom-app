package config

import (
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgmq"
	"pkg/pgstore"
	"pkg/rabbitmq"
	"pkg/redis"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"
)

type Config struct {
	Name                          *base.ServiceName    `validate:"required" envconfig:"SERVICE_NAME" default:"rpg.core"`
	Env                           *base.ServiceEnv     `validate:"required" envconfig:"SERVICE_ENV" default:"dev"`
	Version                       *base.ServiceVersion `validate:"required" envconfig:"SERVICE_VERSION" default:"0.0.1"`
	Logging                       *logging.Config      `validate:"required"`
	Tracing                       *tracing.Config      `validate:"required"`
	PgStore                       *pgstore.Config      `validate:"required"`
	HealthServer                  *health.Config       `validate:"required"`
	Postgres                      *postgres.Config     `validate:"required" envconfig:"PG"`
	RabbitMQ                      *rabbitmq.Config     `validate:"required"`
	Redis                         *redis.Config        `validate:"required"`
	ApiConfig                     *api.Config          `validate:"required"`
	StoreConfig                   *store.Config        `validate:"required"`
	RepositoryConfig              *repository.Config   `validate:"required"`
	EnableDevAPI                  bool                 `envconfig:"ENABLE_DEV_API" default:"false"`
	PaymentServiceURL             string               `envconfig:"PAYMENT_SERVICE_URL" default:"http://rpg.payment"`
	PaymentServiceClientTimeoutMs int                  `envconfig:"PAYMENT_SERVICE_CLIENT_TIMEOUT_MS" default:"10000"`
	EventConsumer                 *pgmq.ConsumerConfig `envconfig:"EVENT_CONSUMER"`
}
