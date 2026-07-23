package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed absence.sql
var absenceSQL string

func (s *service) absence(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, absenceSQL)
	if err != nil {
		s.log.Error("failed to execute absence SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert absence")
	return nil
}
