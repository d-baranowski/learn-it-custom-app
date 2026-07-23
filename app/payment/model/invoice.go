package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Invoice struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.invoice,alias:invoice"`

	Id string `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`

	CreatedAt          unix.Timestamp  `json:"createdAt"`
	CreatedAtDateLabel string          `bun:",scanonly" json:"createdAtDateLabel"`
	CreatedBy          string          `json:"createdBy"`
	CreatedByLabel     string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt          *unix.Timestamp `json:"updatedAt"`
	UpdatedAtDateLabel string          `bun:",scanonly" json:"updatedAtDateLabel"`
	UpdatedBy          *string         `json:"updatedBy"`
	UpdatedByLabel     *string         `bun:",scanonly" json:"updatedByLabel"`
	DeletedAt          *unix.Timestamp `json:"deletedAt"`
	DeletedAtDateLabel string          `bun:",scanonly" json:"deletedAtDateLabel"`
	DeletedBy          *string         `json:"deletedBy"`
	DeletedByLabel     *string         `bun:",scanonly" json:"deletedByLabel"`
}

func (m *Invoice) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.invoice").
		ColumnExpr("invoice.*")
}
