package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type LanguageService struct {
	api.AutocompleteMethod[model.Language]
	api.GetMethod[model.Language, corev1.Language]
	api.ListMethod[model.Language, corev1.ListLanguageResponse]
	api.CreateMethod[model.Language, corev1.SaveLanguageRequest, corev1.Language]
	api.UpdateMethod[model.Language, corev1.SaveLanguageRequest, corev1.Language]
	api.SoftDeleteMethod[model.Language]
	api.DeleteMethod[model.Language]
}

func LanguageServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.language")

	s := api.NewService[
		LanguageService,
		model.Language,

		corev1.Language,
		corev1.ListLanguageResponse,
		corev1.SaveLanguageRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewLanguageServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
