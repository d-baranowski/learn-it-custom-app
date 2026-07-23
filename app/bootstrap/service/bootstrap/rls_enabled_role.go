package bootstrap

import (
	"context"
	_ "embed"

	"go.uber.org/zap"
)

//go:embed rls_enabled_role.sql
var rlsEnabledRole string

func (s *service) rlsEnabledRole(ctx context.Context) error {
	// Execute the SQL to create the app user
	_, err := s.db.ExecContext(ctx, rlsEnabledRole)
	if err != nil {
		s.log.Error("failed to execute app user SQL", zap.Error(err))
		return err
	}

	s.log.Info("Created/updated rls_enabled_role with access to all core schema tables (subject to RLS)")
	return nil
}
