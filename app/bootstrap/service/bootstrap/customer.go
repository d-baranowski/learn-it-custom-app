package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed customer.sql
var customerSQL string

func (s *service) customers(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, customerSQL)
	if err != nil {
		s.log.Error("failed to execute customer SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert customer")
	return nil
}
