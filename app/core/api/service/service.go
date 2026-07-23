package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type ServiceService struct {
	api.AutocompleteMethod[model.Service]
	api.GetMethod[model.Service, corev1.Service]
	api.ListMethod[model.Service, corev1.ListServiceResponse]
	api.CreateMethod[model.Service, corev1.SaveServiceRequest, corev1.Service]
	api.UpdateMethod[model.Service, corev1.SaveServiceRequest, corev1.Service]
	api.SoftDeleteMethod[model.Service]
	api.DeleteMethod[model.Service]
}

func ServiceServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.service")

	s := api.NewService[
		ServiceService,
		model.Service,

		corev1.Service,
		corev1.ListServiceResponse,
		corev1.SaveServiceRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewServiceServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
