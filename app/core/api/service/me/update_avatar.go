package me

import (
	mev1 "app/core/gen/core/me/v1"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"pkg/api"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func (h *Service) UpdateAvatar(ctx context.Context, req *connect.Request[mev1.UpdateAvatarRequest]) (*connect.Response[corev1.User], error) {
	h.log.Debug("UpdateAvatar", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	row := &model.User{
		Avatar: req.Msg.Base64Img,
	}

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewUpdate().
			Model(row).
			Column("avatar").
			Where("id = ?", userID).
			Returning("*").
			Scan(ctx, row)
	})

	if err != nil {
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
