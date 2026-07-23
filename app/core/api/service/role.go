package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	_service "app/core/service"
	"context"
	"pkg/api"
	"pkg/repository"
	"pkg/request/gen/request/v1"
	"pkg/tracing"

	"github.com/uptrace/bun"
)

type RoleService struct {
	api.AutocompleteMethod[model.Role]
	api.GetMethod[model.Role, corev1.Role]
	api.ListMethod[model.Role, corev1.ListRoleResponse]
	api.CreateMethod[model.Role, corev1.SaveRoleRequest, corev1.Role]
	api.UpdateMethod[model.Role, corev1.SaveRoleRequest, corev1.Role]
	api.SoftDeleteMethod[model.Role]
	api.DeleteMethod[model.Role]
}

func RoleServiceProvider(props ApiServiceProps, permissionService _service.PermissionService) error {
	tracer := tracing.NewTracer("api.role")

	s := api.NewService[
		RoleService,
		model.Role,
		corev1.Role,
		corev1.ListRoleResponse,
		corev1.SaveRoleRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.SoftDeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.Role, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterRolesDeleted(ctx, tx, result)
	})

	s.DeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.Role, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterRolesDeleted(ctx, tx, result)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewRoleServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
