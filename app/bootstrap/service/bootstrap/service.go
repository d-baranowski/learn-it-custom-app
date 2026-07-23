package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed service.sql
var serviceSQL string

func (s *service) services(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, serviceSQL)
	if err != nil {
		s.log.Error("failed to execute service SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert service")
	return nil
}
