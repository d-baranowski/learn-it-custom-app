package bootstrap

import (
	"context"
	_ "embed"

	"go.uber.org/zap"
)

//go:embed session.sql
var sessionSQL string

func (s *service) sessions(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, sessionSQL)
	if err != nil {
		s.log.Error("failed to execute session SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert session")
	return nil
}
