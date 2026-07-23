package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type AbsenceService struct {
	api.AutocompleteMethod[model.Absence]
	api.GetMethod[model.Absence, corev1.Absence]
	api.ListMethod[model.Absence, corev1.ListAbsenceResponse]
	api.CreateMethod[model.Absence, corev1.SaveAbsenceRequest, corev1.Absence]
	api.UpdateMethod[model.Absence, corev1.SaveAbsenceRequest, corev1.Absence]
	api.SoftDeleteMethod[model.Absence]
	api.DeleteMethod[model.Absence]
}

func AbsenceServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.absence")

	s := api.NewService[
		AbsenceService,
		model.Absence,

		corev1.Absence,
		corev1.ListAbsenceResponse,
		corev1.SaveAbsenceRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewAbsenceServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
