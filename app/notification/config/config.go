package config

import (
	"pkg/api"
	"pkg/base"
	"pkg/database/postgres"
	"pkg/health"
	"pkg/logging"
	"pkg/pgstore"
	"pkg/pgmq"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"
)

type Config struct {
	Name             *base.ServiceName    `validate:"required" envconfig:"SERVICE_NAME" default:"rpg.notification"`
	Env              *base.ServiceEnv     `validate:"required" envconfig:"SERVICE_ENV" default:"dev"`
	Version          *base.ServiceVersion `validate:"required" envconfig:"SERVICE_VERSION" default:"0.0.1"`
	Logging          *logging.Config      `validate:"required"`
	Tracing          *tracing.Config      `validate:"required"`
	PgStore          *pgstore.Config      `validate:"required"`
	HealthServer     *health.Config       `validate:"required"`
	Postgres         *postgres.Config     `validate:"required" envconfig:"PG"`
	ApiConfig        *api.Config          `validate:"required"`
	StoreConfig      *store.Config        `validate:"required"`
	RepositoryConfig *repository.Config   `validate:"required"`
	EmailConfig      *EmailConfig         `envconfig:"EMAIL"`
	SmsConfig        *SmsConfig           `envconfig:"SMS"`
	Dispatch         *NotificationDispatchConfig `envconfig:"DISPATCH"`
	PublicWebhookURL string               `envconfig:"PUBLIC_WEBHOOK_URL"`
	QuietHoursWindow string               `envconfig:"QUIET_HOURS"`
	Timezone         string               `envconfig:"TIMEZONE" default:"Europe/Warsaw"`
	EnableDevAPI     bool                 `envconfig:"ENABLE_DEV_API" default:"false"`
	EventConsumer    *pgmq.ConsumerConfig `envconfig:"EVENT_CONSUMER"`
	Reminder         *ReminderConfig      `envconfig:"REMINDER"`
	CoreServiceURL   string               `envconfig:"CORE_SERVICE_URL" default:"http://rpg.core"`
}

type ReminderConfig struct {
	PollIntervalMs int `envconfig:"POLL_INTERVAL_MS" default:"30000"`
	LeadTimeMs     int `envconfig:"LEAD_TIME_MS"     default:"86400000"`
	BatchSize      int `envconfig:"BATCH_SIZE"       default:"10"`
}

type PublicWebhookURL string

type NotificationDispatchConfig struct {
	PollIntervalMs int `envconfig:"POLL_INTERVAL_MS" default:"2000"`
	MaxAttempts    int `envconfig:"MAX_ATTEMPTS"     default:"5"`
	BaseDelayMs    int `envconfig:"BASE_DELAY_MS"    default:"1000"`
	MaxDelayMs     int `envconfig:"MAX_DELAY_MS"     default:"300000"`
}

type EmailConfig struct {
	ID            string `default:"notification-outbound-email"`
	FromAddress   string `envconfig:"FROM_ADDRESS"`
	FromName      string `envconfig:"FROM_NAME" default:"Utro Notifications"`
	APIKey        string `envconfig:"API_KEY"`
	WebhookSecret string `envconfig:"WEBHOOK_SECRET"`
}

type SmsConfig struct {
	ID         string `default:"notification-outbound-sms"`
	AccountSID string `envconfig:"ACCOUNT_SID"`
	AuthToken  string `envconfig:"AUTH_TOKEN"`
	FromPhone  string `envconfig:"FROM_PHONE"`
	APIBaseURL string `envconfig:"TWILIO_API_BASE_URL" default:"https://api.twilio.com"`
}
