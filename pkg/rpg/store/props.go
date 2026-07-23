package store

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"pkg/health"
)

type StoreProps struct {
	fx.In

	DB           *pgxpool.Pool
	HealthServer *health.Server
	Config       *Config
}
