package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed therapy.sql
var therapySQL string

func (s *service) therapies(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, therapySQL)
	if err != nil {
		s.log.Error("failed to execute therapy SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert therapy")
	return nil
}
