package service

import (
	"app/core/gen/core/me/v1/mev1connect"
	"app/gateway/config"
	"app/gateway/service"
)

func MeServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	err := gateway.AddProxiedService(backends.Core, mev1connect.MeServiceName, true)
	if err != nil {
		return err
	}

	return nil
}
