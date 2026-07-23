package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	_service "app/core/service"
	"context"
	"pkg/api"
	"pkg/repository"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

type UserService struct {
	Tracer     *tracing.Tracer
	repository *repository.Repository[model.User, corev1.User, corev1.SaveUserRequest]

	api.AutocompleteMethod[model.User]
	api.GetMethod[model.User, corev1.User]
	api.ListMethod[model.User, corev1.ListUserResponse]
	api.CreateMethod[model.User, corev1.SaveUserRequest, corev1.User]
	api.UpdateMethod[model.User, corev1.SaveUserRequest, corev1.User]
	api.SoftDeleteMethod[model.User]
	api.DeleteMethod[model.User]
}

func UserServiceProvider(props ApiServiceProps, permissionService _service.PermissionService) error {
	tracer := tracing.NewTracer("api.user")

	s := api.NewService[
		UserService,
		model.User,
		corev1.User,
		corev1.ListUserResponse,
		corev1.SaveUserRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)
	s.repository = repository.NewRepository[model.User, corev1.User, corev1.SaveUserRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	s.AutocompleteMethod.SetBuilder(func(q *bun.SelectQuery, extra *repository.ExtraInfoReq[requestv1.AutocompleteRequest]) (*bun.SelectQuery, error) {
		return q.Where("disabled = ?", false), nil
	})

	s.SoftDeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.User, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterUsersDeleted(ctx, tx, result)
	})

	s.DeleteMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result []*model.User, extra *repository.ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error {
		return permissionService.AfterUsersDeleted(ctx, tx, result)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewUserServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (h *UserService) BulkResetUserPassword(ctx context.Context, req *connect.Request[corev1.BulkResetUserPasswordRequest]) (*connect.Response[emptypb.Empty], error) {
	spanCtx, span, log := h.Tracer.Start(ctx, "bulkResetUserPassword")
	defer span.End()

	log.Debug("bulkResetUserPassword", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	var row model.User

	if err := row.SetPassword(&req.Msg.Password); err != nil {
		return nil, err
	}

	err := h.repository.Run(spanCtx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewUpdate().
			Model(row).
			Column("password_hash").
			Where("id IN (?)", bun.In(req.Msg.Ids)).
			Returning("*").
			Scan(ctx, row)
	})
	if err != nil {
		log.Error("failed to update password", zap.Error(err))
		span.RecordError(err)
		return nil, api.CommonApiErrorHandler(err)
	}

	return &connect.Response[emptypb.Empty]{
		Msg: &emptypb.Empty{},
	}, nil
}

func (h *UserService) ResetUserPassword(ctx context.Context, req *connect.Request[corev1.ResetUserPasswordRequest]) (*connect.Response[emptypb.Empty], error) {
	return h.updatePassword(ctx, req, true)
}

func (h *UserService) UpdateUserPassword(ctx context.Context, req *connect.Request[corev1.ResetUserPasswordRequest]) (*connect.Response[emptypb.Empty], error) {
	return h.updatePassword(ctx, req, false)
}

func (h *UserService) updatePassword(ctx context.Context, req *connect.Request[corev1.ResetUserPasswordRequest], isReset bool) (*connect.Response[emptypb.Empty], error) {
	spanCtx, span, log := h.Tracer.Start(ctx, "updateOrResetUserPassword")
	defer span.End()

	log.Debug("updatePassword", zap.Any("headers", req.Header()), zap.Any("req", req.Msg), zap.Bool("isReset", isReset))

	if err := api.Validator.Validate(req.Msg); err != nil {
		log.Error("validation error", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	row := &model.User{
		Id: req.Msg.Id,
	}

	if err := row.SetPassword(&req.Msg.Password); err != nil {
		return nil, err
	}

	err := h.repository.Run(spanCtx, func(ctx context.Context, tx bun.Tx) error {
		updateQuery := tx.NewUpdate().
			Model(row).
			Column("password_hash", "reset_pass").
			Set("password_hash = ?", row.PasswordHash)

		if isReset {
			updateQuery.Set("reset_pass = true")
		} else {
			updateQuery.Set("reset_pass = false")
		}

		return updateQuery.
			WherePK().
			Returning("*").
			Scan(ctx, row)
	})
	if err != nil {
		log.Error("failed to update password", zap.Error(err))
		span.RecordError(err)
		return nil, api.CommonApiErrorHandler(err)
	}

	return &connect.Response[emptypb.Empty]{
		Msg: &emptypb.Empty{},
	}, nil
}
