package service

import (
	"app/gateway/config"
	"app/gateway/service"
	paymentv1connect "app/payment/gen/payment/v1/paymentv1connect"
)

func PaymentServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	err := gateway.AddProxiedService(backends.Payment, paymentv1connect.PaymentServiceName, true)
	if err != nil {
		return err
	}

	return nil
}
