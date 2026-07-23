package model

import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/schema"
	"go.uber.org/fx"
)

var Module = fx.Module("modelModule",
	fx.Invoke(registerModelsWithBun),
)

func registerModelsWithBun(db *bun.DB, tables *schema.Tables) {
	db.RegisterModel((*PaymentLink)(nil))
	tables.Register((*PaymentLink)(nil))
}
