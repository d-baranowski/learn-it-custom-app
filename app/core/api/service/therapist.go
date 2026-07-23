package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type TherapistService struct {
	api.AutocompleteMethod[model.Therapist]
	api.GetMethod[model.Therapist, corev1.Therapist]
	api.ListMethod[model.Therapist, corev1.ListTherapistResponse]
	api.CreateMethod[model.Therapist, corev1.SaveTherapistRequest, corev1.Therapist]
	api.UpdateMethod[model.Therapist, corev1.SaveTherapistRequest, corev1.Therapist]
	api.SoftDeleteMethod[model.Therapist]
	api.DeleteMethod[model.Therapist]
}

func TherapistServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.therapist")

	s := api.NewService[
		TherapistService,
		model.Therapist,

		corev1.Therapist,
		corev1.ListTherapistResponse,
		corev1.SaveTherapistRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTherapistServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
