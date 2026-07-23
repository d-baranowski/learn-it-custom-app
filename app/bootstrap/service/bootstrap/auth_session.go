package bootstrap

import (
	coremodel "app/core/model"
	"context"
	"database/sql"
	"errors"
	"time"

	"pkg/unix"
)

// Fixed, long-lived auth sessions for the E2E suite. Cypress injects an
// RPG_AUTH_TOKEN cookie whose sessionId points at one of these rows so tests
// skip the login UI (tools/e2e-test/cypress/support/commands.ts). The ids are
// stable 27-char values (core.user_session.id is char(27)) and MUST match the
// SEEDED_SESSIONS map in tools/e2e-test/cypress/utils/test-users.ts. Seeding is
// gated by SEED_E2E_SESSIONS so production never gets fixed sessions.
const (
	AdminSessionID = "E2ESEEDEDADMINSESSION000001"
	AdamUserID     = "37C6yuezOh2tMDfwLqmgWoKS0tD"
	AdamSessionID  = "E2ESEEDEDADAMSESSION0000001"
)

func (s *service) authSessions(ctx context.Context) error {
	if err := s.seedSession(ctx, AdminSessionID, AdminUserID); err != nil {
		return err
	}
	return s.seedSession(ctx, AdamSessionID, AdamUserID)
}

// seedSession idempotently inserts a long-lived session row, mirroring the
// select-then-insert pattern used by adminUser/migratorUser.
func (s *service) seedSession(ctx context.Context, id, userID string) error {
	sess := new(coremodel.UserSession)

	err := s.db.NewSelect().Model(sess).Where("id = ?", id).Scan(ctx)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if sess.Id != "" {
		return nil
	}

	sess.Id = id
	sess.UserId = userID
	sess.CreatedAt = unix.Now()
	sess.Expires = unix.Now().AddDuration(time.Hour * 24 * 365 * 10)

	_, err = s.db.NewInsert().Model(sess).Returning("*").Exec(ctx)
	return err
}
