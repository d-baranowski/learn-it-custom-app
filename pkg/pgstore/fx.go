package pgstore

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"pkg/base"
)

func ProvideElection(ctx context.Context, db *pgxpool.Pool, config *Config, name *base.ServiceName) (Election, error) {
	e, err := NewElection(db, name.String(), config.ElectionTtl)
	if err != nil {
		return nil, err
	}

	e.Start(ctx)

	return e, nil
}

var Module = fx.Module("pgstore",
	fx.Provide(ProvideElection),
)
