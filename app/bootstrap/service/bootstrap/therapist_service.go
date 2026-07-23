package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed therapist_service.sql
var therapistServiceSQL string

func (s *service) therapistServices(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, therapistServiceSQL)
	if err != nil {
		s.log.Error("failed to execute therapist_service SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert therapist_service")
	return nil
}
