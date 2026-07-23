package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"pkg/api"
	"pkg/repository"
	v1 "pkg/request/gen/request/v1"
	"pkg/tracing"
)

type TherapistServiceLinkService struct {
	api.AutocompleteMethod[model.TherapistService]
	api.GetMethod[model.TherapistService, corev1.TherapistServiceLink]
	api.ListMethod[model.TherapistService, corev1.ListTherapistServiceLinkResponse]
	api.CreateMethod[model.TherapistService, corev1.SaveTherapistServiceLinkRequest, corev1.TherapistServiceLink]
	api.UpdateMethod[model.TherapistService, corev1.SaveTherapistServiceLinkRequest, corev1.TherapistServiceLink]
	api.SoftDeleteMethod[model.TherapistService]
	api.DeleteMethod[model.TherapistService]
}

func TherapistServiceLinkServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.therapist_service")

	s := api.NewService[
		TherapistServiceLinkService,
		model.TherapistService,

		corev1.TherapistServiceLink,
		corev1.ListTherapistServiceLinkResponse,
		corev1.SaveTherapistServiceLinkRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.AutocompleteMethod.AddPostHook(func(ctx context.Context, result []*model.TherapistService, extra *repository.ExtraInfoReqResp[v1.AutocompleteRequest, v1.AutocompleteResponse]) error {
		for i, item := range extra.Response.Items {
			if i < len(result) {
				item.ID = result[i].ServiceId
			}
		}
		return nil
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTherapistServiceLinkServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
