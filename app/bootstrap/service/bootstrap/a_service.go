package bootstrap

import (
	bootstrapconfig "app/bootstrap/config"
	coremodel "app/core/model"
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"pkg/database/postgres"
	"pkg/unix"
	"pkg/util"

	"github.com/segmentio/ksuid"
	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var AdminUserID = "2imfnAVjkbfcwEos1LLLztn1vEP"
var MigratorUserID = "2jYCKBU6P5omxfSEh4CdGsV2nuZ"

type Service interface {
	Run(ctx context.Context) error
}

type service struct {
	id              string
	db              *bun.DB
	log             *zap.Logger
	tracer          trace.Tracer
	seedE2ESessions bool
}

type ServiceProps struct {
	fx.In

	Pg     *postgres.Connection
	Log    *zap.Logger
	Config *bootstrapconfig.Config
}

func ServiceProvider(props ServiceProps) (Service, error) {
	s := &service{
		id:              ksuid.New().String(),
		db:              props.Pg.DB,
		log:             props.Log.Named("bootstrap-service"),
		tracer:          otel.Tracer("bootstrap-service"),
		seedE2ESessions: props.Config.SeedE2ESessions,
	}

	return s, nil
}

// alreadySeeded reports whether a previous Run completed in full.
//
// The probe is core.recurring_cashflow, deliberately: it is the LAST thing Run
// seeds. Probing something early (the admin user, say) would report "seeded"
// for a run that died half way, and we would then skip a partially populated
// database and pretend everything was fine.
//
// Using the last step means a partial run is NOT skipped. It will be retried
// and will fail loudly on duplicate keys from the steps that did complete —
// which is the correct outcome. Bootstrap.Run is not idempotent (only
// permission.sql carries ON CONFLICT DO NOTHING; the other seed files are bare
// INSERTs with hardcoded ids), so a half-seeded database needs a human, and
// failing is how it asks for one.
//
// NOTE: this must run as the owner of the core tables (the `migrations` role).
// Those tables have RLS and Aurora grants BYPASSRLS to nobody, so a non-owner
// would be filtered to zero rows and conclude the database was empty.
func (s *service) alreadySeeded(ctx context.Context) (bool, error) {
	n, err := s.db.NewSelect().
		Model((*coremodel.RecurringCashflow)(nil)).
		Count(ctx)
	if err != nil {
		return false, err
	}

	return n > 0, nil
}

func (s *service) Run(ctx context.Context) error {
	// Idempotency gate. Bootstrap runs on every cluster bring-up (see the
	// utr-staging-bootstrap-seed Job in lit-gitops), so re-running against an
	// already-seeded database has to be a happy no-op rather than a pile of
	// duplicate-key errors.
	seeded, err := s.alreadySeeded(ctx)
	if err != nil {
		s.log.Error("failed to determine whether the database is already seeded", zap.Error(err))
		return err
	}

	if seeded {
		s.log.Info("database already bootstrapped, skipping seed")
		return nil
	}

	s.log.Info("database not yet bootstrapped, seeding")

	if err := s.adminUser(ctx); err != nil {
		s.log.Error("failed to create admin user", zap.Error(err))
		return err
	}

	if err := s.migratorUser(ctx); err != nil {
		s.log.Error("failed to create migrator user", zap.Error(err))
		return err
	}

	if err := s.coreEventCdc(ctx); err != nil {
		s.log.Error("failed to restore core-event CDC wiring", zap.Error(err))
		return err
	}

	if err := s.countries(ctx); err != nil {
		s.log.Error("failed to create countries", zap.Error(err))
		return err
	}

	if err := s.users(ctx); err != nil {
		s.log.Error("failed to create users", zap.Error(err))
		return err
	}

	// Seed fixed long-lived auth sessions for the E2E suite (gated). Placed
	// after users() so both the admin user and the SQL-seeded adam exist.
	if s.seedE2ESessions {
		if err := s.authSessions(ctx); err != nil {
			s.log.Error("failed to seed e2e auth sessions", zap.Error(err))
			return err
		}
	}

	if err := s.permissions(ctx); err != nil {
		s.log.Error("failed to setup permissions", zap.Error(err))
		return err
	}

	if err := s.services(ctx); err != nil {
		s.log.Error("failed to create services", zap.Error(err))
		return err
	}

	if err := s.languages(ctx); err != nil {
		s.log.Error("failed to create languages", zap.Error(err))
		return err
	}

	if err := s.therapists(ctx); err != nil {
		s.log.Error("failed to create therapists", zap.Error(err))
		return err
	}

	if err := s.therapistServices(ctx); err != nil {
		s.log.Error("failed to create therapist services", zap.Error(err))
		return err
	}

	if err := s.workingHours(ctx); err != nil {
		s.log.Error("failed to create working hours", zap.Error(err))
		return err
	}

	if err := s.absence(ctx); err != nil {
		s.log.Error("failed to create absence", zap.Error(err))
		return err
	}

	if err := s.customers(ctx); err != nil {
		s.log.Error("failed to create customers", zap.Error(err))
		return err
	}

	if err := s.therapistCustomers(ctx); err != nil {
		s.log.Error("failed to create therapist customers", zap.Error(err))
		return err
	}

	if err := s.offices(ctx); err != nil {
		s.log.Error("failed to create offices", zap.Error(err))
		return err
	}

	if err := s.rooms(ctx); err != nil {
		s.log.Error("failed to create rooms", zap.Error(err))
		return err
	}

	if err := s.therapies(ctx); err != nil {
		s.log.Error("failed to create therapies", zap.Error(err))
		return err
	}

	if err := s.sessions(ctx); err != nil {
		s.log.Error("failed to create sessions", zap.Error(err))
		return err
	}

	if err := s.therapistPictureService(ctx); err != nil {
		s.log.Error("failed to create pictures for therapists", zap.Error(err))
		return err
	}

	if err := s.recurringCashflows(ctx); err != nil {
		s.log.Error("failed to create recurring cashflows and transactions", zap.Error(err))
		return err
	}

	return nil
}

func (s *service) adminUser(ctx context.Context) error {
	user := new(coremodel.User)

	err := s.db.NewSelect().Model(user).Where("id = ?", AdminUserID).Scan(ctx)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
	}

	if user.Id == "" {
		user.Id = AdminUserID
		user.Username = "admin"
		user.Email = util.PStr("admin@pathtech.net")
		user.DisplayName = util.PStr("Admin")
		user.PasswordHash = "$2a$10$dxsX04BLRD.h0dXvI2.Lx.Ha.uCh/7cHwEsvg86de.gbPhA5oHwa2"
		user.CreatedAt = unix.Now()
		user.CreatedBy = MigratorUserID

		_, err = s.db.NewInsert().Model(user).Returning("*").Exec(ctx)
		if err != nil {
			return err
		}
	}

	// insert permissions
	permission := new(coremodel.Permission)

	err = s.db.NewSelect().Model(permission).Where("user_id = ?", AdminUserID).Scan(ctx)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
	}

	if permission.Id == "" {
		permission.UserId = &AdminUserID
		permission.Key = "All"
		permission.Abilities = []string{"All"}
		permission.Revoke = false
		permission.CreatedAt = unix.Now()
		permission.CreatedBy = MigratorUserID

		_, err = s.db.NewInsert().Model(permission).Returning("*").Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *service) migratorUser(ctx context.Context) error {
	user := new(coremodel.User)

	err := s.db.NewSelect().Model(user).Where("id = ?", MigratorUserID).Scan(ctx)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
	}

	if user.Id == "" {
		user.Id = MigratorUserID
		user.Username = "migrator"
		user.Email = util.PStr("migrator@pathdev.net")
		user.DisplayName = util.PStr("Migrator")
		user.CreatedAt = unix.Now()
		user.CreatedBy = "migrator"

		_, err = s.db.NewInsert().Model(user).Returning("*").Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}
