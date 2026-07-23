package session

import (
	sessionv1 "app/core/gen/core/session/v1"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"database/sql"
	"errors"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"
	"time"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *Service) GetUserSession(ctx context.Context, req *connect.Request[sessionv1.GetUserSessionRequest]) (*connect.Response[sessionv1.UserSession], error) {
	ctx, span, _ := h.tracer.Start(ctx, "GetUserSession")
	defer span.End()

	h.log.Debug("GetUserSession", zap.Any("headers", req.Header()))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	sessionCtx, sessionSpan, _ := h.tracer.Start(ctx, "fetchUserSessionRow")
	row, err := h.respository.Get(sessionCtx, req.Msg.Id, &repository.GetExtraProps[model.UserSession, corev1.Session, corev1.SaveSessionRequest]{
		UserId: &userID,
	})
	sessionSpan.End()
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, connect.NewError(connect.CodeUnauthenticated, nil)
		}
		return nil, err
	}

	userCtx, userSpan, _ := h.tracer.Start(ctx, "fetchUserRow")
	var userRow model.User
	err = h.respository.Run(userCtx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().Model(&userRow).Where("id = ?", row.UserId).Scan(ctx)
	})
	userSpan.End()
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, connect.NewError(connect.CodeUnauthenticated, nil)
		}
		return nil, err
	}

	return connect.NewResponse(&sessionv1.UserSession{
		Id:     row.Id,
		UserId: row.UserId,
		User: &corev1.User{
			Id:          userRow.Id,
			Username:    userRow.Username,
			DisplayName: userRow.DisplayName,
			Email:       userRow.Email,
			ExternalId:  userRow.ExternalId,
			Avatar:      userRow.Avatar,
			Disabled:    userRow.Disabled,
			ResetPass:   userRow.ResetPass,
			CreatedAt:   userRow.CreatedAt.Int64(),
			CreatedBy:   userRow.CreatedBy,
			UpdatedAt:   userRow.UpdatedAt.Int64Ptr(),
			UpdatedBy:   userRow.UpdatedBy,
		},
		Expires: row.Expires.Int64(),
	}), nil
}

func (h *Service) CreateUserSession(ctx context.Context, req *connect.Request[sessionv1.CreateUserSessionRequest]) (*connect.Response[sessionv1.UserSession], error) {
	h.log.Debug("CreateUserSession", zap.Any("headers", req.Header()))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	if req.Msg.UserId == nil && req.Msg.Email == nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("user id or email is required"))
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	row := model.UserSession{
		Expires: unix.Now().AddDuration(time.Hour * 24 * 7),
	}

	var userRow model.User
	resp := &sessionv1.UserSession{
		Id:      row.Id,
		Expires: row.Expires.Int64(),
	}

	if req.Msg.UserId != nil {
		err := h.respository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().Model(&userRow).Where("id = ?", *req.Msg.UserId).Limit(1).Scan(ctx)
		}, repository.RunExtraProps{SkipRLS: true})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, connect.NewError(connect.CodeUnauthenticated, nil)
			}
			return nil, err
		}
		row.UserId = *req.Msg.UserId
	} else {
		err := h.respository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().Model(&userRow).Where("email = ?", *req.Msg.Email).Limit(1).Scan(ctx)
		}, repository.RunExtraProps{SkipRLS: true})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, connect.NewError(connect.CodeUnauthenticated, nil)
			}
			return nil, err
		}
		row.UserId = userRow.Id
	}

	resp.User = &corev1.User{
		Id:          userRow.Id,
		Username:    userRow.Username,
		DisplayName: userRow.DisplayName,
		Email:       userRow.Email,
		ExternalId:  userRow.ExternalId,
		Avatar:      userRow.Avatar,
		Disabled:    userRow.Disabled,
		CreatedAt:   userRow.CreatedAt.Int64(),
		CreatedBy:   userRow.CreatedBy,
		UpdatedAt:   userRow.UpdatedAt.Int64Ptr(),
		UpdatedBy:   userRow.UpdatedBy,
	}

	createdRow, err := h.respository.Create(ctx, &row, &repository.CreateExtraProps[model.UserSession, corev1.Session, corev1.SaveSessionRequest]{
		UserId: &userID,
	})
	if err != nil {
		h.log.Error("Failed to create user session due to error", zap.Error(err))
		return nil, api.CommonApiErrorHandler(err)
	}

	resp.Id = createdRow.Id
	resp.UserId = createdRow.UserId
	resp.CreatedAt = createdRow.CreatedAt.Int64()

	return connect.NewResponse(resp), nil
}

func (h *Service) UpdateUserSession(ctx context.Context, req *connect.Request[sessionv1.UpdateUserSessionRequest]) (*connect.Response[sessionv1.UserSession], error) {
	h.log.Debug("UpdateUserSession", zap.Any("headers", req.Header()))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	row := model.UserSession{
		Id:      req.Msg.Id,
		UserId:  req.Msg.UserId,
		Expires: unix.Int64ToTimestamp(req.Msg.Expires),
	}

	_, err := h.respository.Update(ctx, &row, &repository.UpdateOptions[model.UserSession, corev1.Session, corev1.SaveSessionRequest]{
		UserId: &userID,
	})
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	return connect.NewResponse(&sessionv1.UserSession{
		Id:      row.Id,
		UserId:  row.UserId,
		Expires: row.Expires.Int64(),
	}), nil
}

func (h *Service) DeleteUserSession(ctx context.Context, req *connect.Request[sessionv1.DeleteUserSessionRequest]) (*connect.Response[emptypb.Empty], error) {
	h.log.Debug("DeleteUserSession", zap.Any("headers", req.Header()))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	_, err := h.respository.Delete(ctx, []string{req.Msg.Id}, &repository.DeleteOptions[model.UserSession]{
		UserId: &userID,
	})
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}
