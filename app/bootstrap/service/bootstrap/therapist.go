package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed therapist.sql
var therapistSQL string

func (s *service) therapists(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, therapistSQL)
	if err != nil {
		s.log.Error("failed to execute therapist SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert therapist")
	return nil
}
