package bootstrap

import (
	"context"
	_ "embed"

	"go.uber.org/zap"
)

//go:embed app_grants.sql
var appGrants string

// grantAppAccess grants the `app` login role privileges on the core/payment/
// notification schemas. Runs as the migrations role (schema owner) after the
// migrate Jobs. Replaces the former rls_enabled_role indirection: Aurora has no
// BYPASSRLS and role-scoped policies didn't compose with the core.bypass GUC, so
// `app` is granted directly and is subject to the (now uniformly PUBLIC) policies.
func (s *service) grantAppAccess(ctx context.Context) error {
	if _, err := s.db.ExecContext(ctx, appGrants); err != nil {
		s.log.Error("failed to grant app schema access", zap.Error(err))
		return err
	}

	s.log.Info("Granted app role access to core/payment/notification schemas")
	return nil
}
