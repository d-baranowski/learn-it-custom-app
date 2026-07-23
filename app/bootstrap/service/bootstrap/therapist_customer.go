package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed therapist_customer.sql
var therapistCustomerSQL string

func (s *service) therapistCustomers(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, therapistCustomerSQL)
	if err != nil {
		s.log.Error("failed to execute therapist_customer SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert therapist_customer")
	return nil
}
