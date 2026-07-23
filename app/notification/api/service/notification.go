package service

import (
	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/gen/notification/v1/notificationv1connect"
	"app/notification/model"
	"pkg/api"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"
)

type NotificationService struct {
	api.GetMethod[model.Notification, notificationv1.Notification]
	api.ListMethod[model.Notification, notificationv1.ListNotificationResponse]
	api.SoftDeleteMethod[model.Notification]
}

func NotificationServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.notification")

	s := api.NewService[
		NotificationService,
		model.Notification,
		notificationv1.Notification,
		notificationv1.ListNotificationResponse,
		requestv1.DeleteRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := notificationv1connect.NewNotificationServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
