package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed office.sql
var officeSQL string

func (s *service) offices(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, officeSQL)
	if err != nil {
		s.log.Error("failed to execute office SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Inserted bootstrap office")
	return nil
}
