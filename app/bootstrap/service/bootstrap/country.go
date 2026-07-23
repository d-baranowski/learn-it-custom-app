package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed country.sql
var countrySQL string

func (s *service) countries(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, countrySQL)
	if err != nil {
		s.log.Error("failed to execute country SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert countries")
	return nil
}
