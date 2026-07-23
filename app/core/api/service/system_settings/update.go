package system_settings

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"fmt"
	"pkg/ctxHelpers"
	"pkg/unix"

	"connectrpc.com/connect"
	"go.uber.org/zap"
)

func (h *Service) Update(ctx context.Context, req *connect.Request[corev1.SaveSystemSettingsRequest]) (*connect.Response[corev1.SystemSettings], error) {
	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	// Get the current latest version number
	var currentVersion int32
	err := h.db.NewSelect().
		TableExpr("core.system_settings").
		ColumnExpr("version").
		OrderExpr("version DESC").
		Limit(1).
		Scan(ctx, &currentVersion)

	if err != nil {
		h.log.Error("Failed to get current settings version", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get current settings version: %w", err))
	}

	// Insert a new row with incremented version
	now := unix.Now()
	newRow := &model.SystemSettings{
		Version:                       currentVersion + 1,
		SystemTimezone:                req.Msg.SystemTimezone,
		SessionDefaultDurationMinutes: req.Msg.SessionDefaultDurationMinutes,
		CreatedAt:                     now,
		CreatedBy:                     userID,
	}

	_, err = h.db.NewInsert().
		Model(newRow).
		Returning("*").
		Exec(ctx)

	if err != nil {
		h.log.Error("Failed to insert new settings version", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to save system settings: %w", err))
	}

	// Re-query with joined creator label
	var row model.SystemSettings
	err = h.db.NewSelect().
		TableExpr("core.system_settings AS system_settings").
		ColumnExpr("system_settings.*").
		ColumnExpr("creator.display_name AS created_by_label").
		Join("LEFT JOIN core.user AS creator ON creator.id = system_settings.created_by").
		Where("system_settings.id = ?", newRow.Id).
		Scan(ctx, &row)

	if err != nil {
		h.log.Error("Failed to re-read new settings", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to read saved settings: %w", err))
	}

	return connect.NewResponse(toProto(&row)), nil
}
