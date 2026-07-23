package service

import (
	"app/core/gen/core/session/v1/sessionv1connect"
	"app/gateway/config"
	"app/gateway/service"
)

func SessionServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	err := gateway.AddProxiedService(backends.Core, sessionv1connect.SessionServiceName, false)
	if err != nil {
		return err
	}

	return nil
}
