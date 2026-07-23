package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed permission.sql
var permissionSQL string

func (s *service) permissions(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, permissionSQL)
	if err != nil {
		s.log.Error("failed to execute location SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert permissions roles and extra users")
	return nil
}
