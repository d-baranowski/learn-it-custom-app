package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed working_hours.sql
var workingHoursSQL string

func (s *service) workingHours(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, workingHoursSQL)
	if err != nil {
		s.log.Error("failed to execute working hours SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert working hours")
	return nil
}
