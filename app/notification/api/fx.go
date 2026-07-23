package api

import (
	"app/notification/api/service"
	"app/notification/api/service/dev"

	"go.uber.org/fx"
)

var Module = fx.Module("handlers",
	fx.Provide(service.ResendVerifierProvider),
	fx.Provide(service.TwilioVerifierProvider),
	fx.Invoke(dev.DevServiceProvider),
	fx.Invoke(service.NotificationServiceProvider),
	fx.Invoke(service.NotificationSendServiceProvider),
	fx.Invoke(service.ResendWebhookServiceProvider),
	fx.Invoke(service.TwilioWebhookServiceProvider),
	fx.Invoke(service.NotificationTemplateServiceProvider),
	fx.Invoke(service.NotificationEventTypeServiceProvider),
	fx.Invoke(service.NotificationPreferenceServiceProvider),
)
