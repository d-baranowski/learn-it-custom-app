package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type CustomerService struct {
	api.AutocompleteMethod[model.Customer]
	api.GetMethod[model.Customer, corev1.Customer]
	api.ListMethod[model.Customer, corev1.ListCustomerResponse]
	api.CreateMethod[model.Customer, corev1.SaveCustomerRequest, corev1.Customer]
	api.UpdateMethod[model.Customer, corev1.SaveCustomerRequest, corev1.Customer]
	api.SoftDeleteMethod[model.Customer]
	api.DeleteMethod[model.Customer]
}

func CustomerServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.customer")

	s := api.NewService[
		CustomerService,
		model.Customer,

		corev1.Customer,
		corev1.ListCustomerResponse,
		corev1.SaveCustomerRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewCustomerServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Customer, extra *repository.ExtraInfoReqResp[corev1.SaveCustomerRequest, corev1.Customer]) error {
		return ensureCurrentTherapistCustomerLink(ctx, tx, result.Id, result.CreatedBy)
	})

	return nil
}

// ensureCurrentTherapistCustomerLink links a newly created customer to the therapist mapped to
// the current request user (the same user that populates result.CreatedBy during create).
// It applies only for own-scope (non-admin-level) creators with an associated therapist record.
func ensureCurrentTherapistCustomerLink(ctx context.Context, tx bun.Tx, customerID, createdBy string) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO core.therapist_customer (therapist_id, customer_id, created_at, created_by)
		SELECT core.current_user_therapist_id(), ?, ?, ?
		WHERE core.current_user_therapist_id() IS NOT NULL
		  -- Scope 1 = own-scope (non-admin); Scope 2 = all-scope (admin-level).
		  AND core.can_create('Customer', 1)
		  AND NOT core.can_create('Customer', 2)
		ON CONFLICT (therapist_id, customer_id) DO NOTHING
	`, customerID, unix.NowInt64(), createdBy)
	return err
}
