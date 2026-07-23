package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"app/core/service"
	"context"
	"pkg/api"
	"pkg/repository"
	"pkg/request/gen/request/v1"
	"pkg/tracing"

	"github.com/uptrace/bun"
)

type PermissionService struct {
	api.AutocompleteMethod[model.Permission]
	api.GetMethod[model.Permission, corev1.Permission]
	api.ListMethod[model.Permission, corev1.ListPermissionResponse]
	api.CreateMethod[model.Permission, corev1.SavePermissionRequest, corev1.Permission]
	api.UpdateMethod[model.Permission, corev1.SavePermissionRequest, corev1.Permission]
	api.SoftDeleteMethod[model.Permission]
	api.DeleteMethod[model.Permission]
}

func PermissionServiceProvider(props ApiServiceProps, permissionService service.PermissionService) error {
	tracer := tracing.NewTracer("api.Permission")

	s := api.NewService[
		PermissionService,
		model.Permission,

		corev1.Permission,
		corev1.ListPermissionResponse,
		corev1.SavePermissionRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewPermissionServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Permission, extra *repository.ExtraInfoReqResp[corev1.SavePermissionRequest, corev1.Permission]) error {
		return permissionService.AfterPermissionCreated(ctx, tx, result)
	})

	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Permission, extra *repository.ExtraInfoReqResp[corev1.SavePermissionRequest, corev1.Permission]) error {
		return permissionService.AfterPermissionUpdated(ctx, tx, result)
	})

	s.DeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.Permission, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterPermissionsDeleted(ctx, tx, result)
	})

	s.SoftDeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.Permission, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterPermissionsDeleted(ctx, tx, result)
	})

	return nil
}
