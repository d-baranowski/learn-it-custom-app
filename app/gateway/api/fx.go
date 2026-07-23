package backend

import (
	"app/gateway/api/service"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Invoke(service.AuthServiceProvider),
	fx.Invoke(service.CoreServiceProvider),
	fx.Invoke(service.MeServiceProvider),
	fx.Invoke(service.NotificationServiceProvider),
	fx.Invoke(service.PaymentServiceProvider),
	fx.Invoke(service.SessionServiceProvider),
	fx.Invoke(service.WebhookGatewayProvider),
)
