package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed recurring_cashflow.sql
var recurringCashflowSQL string

func (s *service) recurringCashflows(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, recurringCashflowSQL)
	if err != nil {
		s.log.Error("failed to execute recurring cashflow SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert recurring cashflows and transactions")
	return nil
}
