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

func (s *service) Run(ctx context.Context) error {
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
