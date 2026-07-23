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

	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
	"github.com/uptrace/bun"
)

type UserRoleService struct {
	DB     *bun.DB
	Tracer *tracing.Tracer

	api.GetMethod[model.UserRole, corev1.UserRole]
	api.ListMethod[model.UserRole, corev1.ListUserRoleResponse]
	api.CreateMethod[model.UserRole, corev1.SaveUserRoleRequest, corev1.UserRole]
	api.UpdateMethod[model.UserRole, corev1.SaveUserRoleRequest, corev1.UserRole]
	api.DeleteMethod[model.UserRole]
}

func UserRoleServiceProvider(props ApiServiceProps, permissionService _service.PermissionService) error {
	tracer := tracing.NewTracer("api.userRole")

	s := api.NewService[
		UserRoleService,
		model.UserRole,
		corev1.UserRole,
		corev1.ListUserRoleResponse,
		corev1.SaveUserRoleRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.UserRole, extra *repository.ExtraInfoReqResp[corev1.SaveUserRoleRequest, corev1.UserRole]) error {
		return permissionService.AfterUserRoleCreated(ctx, tx, result)
	})

	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.UserRole, extra *repository.ExtraInfoReqResp[corev1.SaveUserRoleRequest, corev1.UserRole]) error {
		return permissionService.AfterUserRoleUpdated(ctx, tx, result)
	})

	s.DeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.UserRole, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterUserRolesDeleted(ctx, tx, result)
	})

	bi := api.NewBaseInterceptor()

	otelInterceptor, err := otelconnect.NewInterceptor(otelconnect.WithTrustRemote())
	if err != nil {
		return err
	}

	path, h := corev1connect.NewUserRoleServiceHandler(s, connect.WithInterceptors(bi.Interceptor(), otelInterceptor))
	props.ApiServer.AddHandler(path, h)

	return nil
}
