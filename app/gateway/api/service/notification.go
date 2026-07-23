package service

import (
	"app/gateway/config"
	"app/gateway/service"
	notificationv1connect "app/notification/gen/notification/v1/notificationv1connect"
)

func NotificationServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	if err := gateway.AddProxiedService(backends.Notification, notificationv1connect.NotificationServiceName, true); err != nil {
		return err
	}
	if err := gateway.AddProxiedService(backends.Notification, notificationv1connect.NotificationSendServiceName, true); err != nil {
		return err
	}
	if err := gateway.AddProxiedService(backends.Notification, notificationv1connect.NotificationTemplateServiceName, true); err != nil {
		return err
	}
	if err := gateway.AddProxiedService(backends.Notification, notificationv1connect.NotificationEventTypeServiceName, true); err != nil {
		return err
	}
	if err := gateway.AddProxiedService(backends.Notification, notificationv1connect.NotificationPreferenceServiceName, true); err != nil {
		return err
	}
	return nil
}
