package repository

import (
	"context"
	"encoding/json"
	"pkg/ctxHelpers"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func AttachUserIdToTx(ctx context.Context, log *zap.Logger, tx bun.Tx) error {
	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok || userID == "" {
		userID = ""
		log.Debug("User id not found in context, proceeding without user id for RLS")
	}

	// Create JSON object with user information for PostgreSQL session
	userInfo := map[string]string{
		"x-app-user-id": userID,
	}

	userInfoJSON, err := json.Marshal(userInfo)
	if err != nil {
		// Log error and skip setting the variable
		// This shouldn't happen with a simple string map, but we handle it defensively
		log.Warn("failed to marshal user info for RLS", zap.Error(err), zap.String("userID", userID))
		return err
	}

	// Set the PostgreSQL session variable that core.current_user_id() reads from
	// Use LOCAL so it only affects the current transaction
	// We need to properly escape the JSON string for PostgreSQL
	// Using set_config function which properly handles the value
	// Mark that we're in the process of setting config to prevent recursion
	_, err = tx.ExecContext(ctx, "SELECT set_config('core.user', ?, true)", string(userInfoJSON))
	if err != nil {
		log.Error("failed to set PostgreSQL session variable for RLS",
			zap.Error(err),
			zap.String("userID", userID))
		return err
	}

	if userID != "" {
		_, err = tx.ExecContext(ctx,
			"SELECT set_config('core.therapist_id', COALESCE((SELECT id FROM core.therapist WHERE user_id = ? LIMIT 1), ''), true)",
			userID)
		if err != nil {
			log.Warn("failed to cache therapist_id in session config", zap.Error(err))
		}
	}

	return nil
}
