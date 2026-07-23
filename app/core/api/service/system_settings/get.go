package system_settings

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"fmt"

	"connectrpc.com/connect"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *Service) Get(ctx context.Context, _ *connect.Request[emptypb.Empty]) (*connect.Response[corev1.SystemSettings], error) {
	var row model.SystemSettings
	err := h.db.NewSelect().
		TableExpr("core.system_settings AS system_settings").
		ColumnExpr("system_settings.*").
		ColumnExpr("creator.display_name AS created_by_label").
		Join("LEFT JOIN core.user AS creator ON creator.id = system_settings.created_by").
		OrderExpr("system_settings.version DESC").
		Limit(1).
		Scan(ctx, &row)

	if err != nil {
		h.log.Error("Failed to get system settings", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get system settings: %w", err))
	}

	return connect.NewResponse(toProto(&row)), nil
}

func toProto(row *model.SystemSettings) *corev1.SystemSettings {
	resp := &corev1.SystemSettings{
		Id:                            row.Id,
		Version:                       row.Version,
		SystemTimezone:                row.SystemTimezone,
		SessionDefaultDurationMinutes: row.SessionDefaultDurationMinutes,
		CreatedAt:                     row.CreatedAt.Int64(),
		CreatedBy:                     row.CreatedBy,
	}
	if row.CreatedByLabel != "" {
		resp.CreatedByLabel = &row.CreatedByLabel
	}
	if row.UpdatedAt != nil {
		resp.UpdatedAt = row.UpdatedAt.Int64Ptr()
	}
	if row.UpdatedBy != nil {
		resp.UpdatedBy = row.UpdatedBy
	}
	if row.UpdatedByLabel != nil {
		resp.UpdatedByLabel = row.UpdatedByLabel
	}
	return resp
}
