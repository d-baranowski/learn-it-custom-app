package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Country struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.country,alias:country"`

	Id              string `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	Iso2            string `bun:"iso2" json:"iso2" rpg:"all,required"`
	Iso3            string `bun:"iso3" json:"iso3"`
	Name            string `bun:"name" json:"name"`
	NationalityName string `bun:"nationality_name" json:"nationality_name"`
	TimeZone        string `bun:"timezone" json:"timeZone"`

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

func (*Country) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.country").
		ColumnExpr("country.*")
}

func (*Country) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: repository.AutocompleteTemplateName,
	}
}
