package api

import (
	"app/payment/api/service"

	"go.uber.org/fx"
)

var Module = fx.Module("handlers",
	fx.Invoke(service.InvoiceServiceProvider),
	fx.Invoke(service.PaymentLinkServiceProvider),
	fx.Invoke(service.StripeWebhookServiceProvider),
	fx.Invoke(service.PaymentLinkWorkerProvider),
)
