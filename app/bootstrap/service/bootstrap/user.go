package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed user.sql
var userSQL string

func (s *service) users(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, userSQL)
	if err != nil {
		s.log.Error("failed to execute user SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert user")
	return nil
}
