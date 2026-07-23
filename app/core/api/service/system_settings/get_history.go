package system_settings

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"fmt"

	"connectrpc.com/connect"
	"go.uber.org/zap"
)

func (h *Service) GetHistory(ctx context.Context, req *connect.Request[corev1.GetSystemSettingsHistoryRequest]) (*connect.Response[corev1.GetSystemSettingsHistoryResponse], error) {
	limit := int(req.Msg.Limit)
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	offset := int(req.Msg.Offset)
	if offset < 0 {
		offset = 0
	}

	// Get total count
	var total int
	total, err := h.db.NewSelect().
		TableExpr("core.system_settings").
		Count(ctx)

	if err != nil {
		h.log.Error("Failed to count settings history", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to count settings history: %w", err))
	}

	// Get paginated rows
	var rows []model.SystemSettings
	err = h.db.NewSelect().
		TableExpr("core.system_settings AS system_settings").
		ColumnExpr("system_settings.*").
		ColumnExpr("creator.display_name AS created_by_label").
		Join("LEFT JOIN core.user AS creator ON creator.id = system_settings.created_by").
		OrderExpr("system_settings.version DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx, &rows)

	if err != nil {
		h.log.Error("Failed to get settings history", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get settings history: %w", err))
	}

	items := make([]*corev1.SystemSettings, len(rows))
	for i := range rows {
		items[i] = toProto(&rows[i])
	}

	return connect.NewResponse(&corev1.GetSystemSettingsHistoryResponse{
		Items: items,
		Total: int32(total),
	}), nil
}
