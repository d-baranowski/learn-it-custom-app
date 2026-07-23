package me

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"database/sql"
	"errors"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/repository"

	"connectrpc.com/connect"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *Service) Get(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[corev1.User], error) {
	h.log.Debug("Get", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	row, err := h.repository.Get(ctx, userID, &repository.GetExtraProps[model.User, corev1.User, corev1.SaveUserRequest]{
		UserId: &userID,
	})

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, connect.NewError(connect.CodeNotFound, nil)
		}
		return nil, api.CommonApiErrorHandler(err)
	}

	resp := &corev1.User{
		Id:          row.Id,
		Username:    row.Username,
		DisplayName: row.DisplayName,
		Email:       row.Email,
		ExternalId:  row.ExternalId,
		Avatar:      row.Avatar,
		Disabled:    row.Disabled,
		CreatedAt:   row.CreatedAt.Int64(),
		CreatedBy:   row.CreatedBy,
		UpdatedAt:   row.UpdatedAt.Int64Ptr(),
		UpdatedBy:   row.UpdatedBy,
	}

	return connect.NewResponse(resp), nil
}
