package service

import (
	"app/core/gen/core/auth/v1/authv1connect"
	"app/gateway/config"
	"app/gateway/service"
)

func AuthServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	err := gateway.AddProxiedService(backends.Core, authv1connect.AuthServiceName, false)
	if err != nil {
		return err
	}

	return nil
}
