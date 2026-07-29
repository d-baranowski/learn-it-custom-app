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

	"github.com/uptrace/bun"
)

type TherapistCustomerLinkService struct {
	api.AutocompleteMethod[model.TherapistCustomer]
	api.GetMethod[model.TherapistCustomer, corev1.TherapistCustomerLink]
	api.ListMethod[model.TherapistCustomer, corev1.ListTherapistCustomerLinkResponse]
	api.CreateMethod[model.TherapistCustomer, corev1.SaveTherapistCustomerLinkRequest, corev1.TherapistCustomerLink]
	api.UpdateMethod[model.TherapistCustomer, corev1.SaveTherapistCustomerLinkRequest, corev1.TherapistCustomerLink]
	api.SoftDeleteMethod[model.TherapistCustomer]
	api.DeleteMethod[model.TherapistCustomer]
}

func TherapistCustomerLinkServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.therapist_customer")

	s := api.NewService[
		TherapistCustomerLinkService,
		model.TherapistCustomer,

		corev1.TherapistCustomerLink,
		corev1.ListTherapistCustomerLinkResponse,
		corev1.SaveTherapistCustomerLinkRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	// tx is unused here (this hook is a no-op) but is part of the signature so
	// read hooks that DO query have the outer transaction available rather than
	// reaching for the pool.
	s.AutocompleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.TherapistCustomer, extra *repository.ExtraInfoReqResp[v1.AutocompleteRequest, v1.AutocompleteResponse]) error {
		// No need to modify IDs - return the therapist_customer link ID itself
		return nil
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTherapistCustomerLinkServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
