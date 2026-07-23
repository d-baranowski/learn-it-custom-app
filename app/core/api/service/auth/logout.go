package auth

import (
	"app/core/model"
	"context"
	"pkg/api"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *Service) Logout(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[emptypb.Empty], error) {
	userID, _ := ctxHelpers.GetContextUserID(ctx)

	h.log.Debug("Logout", zap.Any("headers", req.Header()))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		_, err := tx.NewDelete().Model(&model.UserSession{}).Where("user_id = ?", userID).Exec(ctx)
		return err
	})
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}
