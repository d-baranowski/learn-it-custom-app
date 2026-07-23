package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type OfficeService struct {
	api.AutocompleteMethod[model.Office]
	api.GetMethod[model.Office, corev1.Office]
	api.ListMethod[model.Office, corev1.ListOfficeResponse]
	api.CreateMethod[model.Office, corev1.SaveOfficeRequest, corev1.Office]
	api.UpdateMethod[model.Office, corev1.SaveOfficeRequest, corev1.Office]
	api.SoftDeleteMethod[model.Office]
	api.DeleteMethod[model.Office]
}

func OfficeServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.office")

	s := api.NewService[
		OfficeService,
		model.Office,

		corev1.Office,
		corev1.ListOfficeResponse,
		corev1.SaveOfficeRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewOfficeServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
