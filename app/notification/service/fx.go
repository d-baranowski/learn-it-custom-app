package service

import (
	"app/notification/config"
	"pkg/pgmq"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("service",
	fx.Provide(NewNotificationDAO),
	fx.Provide(NewScheduledReminderDAO),
	fx.Provide(NewPreferenceDAO),
	fx.Provide(TemplateRendererProvider),
	fx.Provide(CoreSessionClientProvider),
	fx.Provide(EmailSenderProvider),
	fx.Provide(TwilioSMSClientProvider),
	fx.Provide(SMSSenderProvider),
	fx.Provide(QuietHoursProvider),
	fx.Provide(EventHandlerRegistryProvider),
	fx.Provide(PgmqConsumerProvider),
	fx.Invoke(NotificationDispatchWorkerProvider),
	fx.Invoke(EventConsumerWorkerProvider),
	fx.Invoke(ReminderWorkerProvider),
)

func TemplateRendererProvider(db *bun.DB, log *zap.Logger) *TemplateRenderer {
	return NewTemplateRenderer(db, log)
}

func PgmqConsumerProvider(db *bun.DB, log *zap.Logger) pgmq.Consumer {
	return pgmq.NewConsumer(db, log)
}

func EventHandlerRegistryProvider(log *zap.Logger, reminderDAO ScheduledReminderDAO, preferenceDAO PreferenceDAO, reminderCfg *config.ReminderConfig) *pgmq.Registry {
	registry := pgmq.NewRegistry()
	RegisterEventHandlers(registry, log, EventHandlerDeps{
		ReminderDAO:   reminderDAO,
		PreferenceDAO: preferenceDAO,
		Config:        reminderCfg,
	})
	return registry
}

func QuietHoursProvider(cfg *config.Config) (*QuietHours, error) {
	return NewQuietHours(cfg.QuietHoursWindow, cfg.Timezone)
}
