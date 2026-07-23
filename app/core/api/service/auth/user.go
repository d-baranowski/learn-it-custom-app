package auth

import (
	authv1 "app/core/gen/core/auth/v1"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"database/sql"
	"errors"
	"pkg/api"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func (h *Service) GetUserByAccount(ctx context.Context, req *connect.Request[authv1.GetUserByAccountRequest]) (*connect.Response[corev1.User], error) {
	h.log.Debug("GetUser", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	row := &model.User{}

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().Model(row).Where("email = ?", req.Msg.Account).Scan(ctx)
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
