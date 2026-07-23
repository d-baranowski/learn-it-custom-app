package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Service struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.service,alias:service"`

	Id                  string            `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	DisplayAbbreviation *string           `bun:"display_abbreviation" json:"displayAbbreviation" rpg:"all"`
	Name                TranslatedString  `bun:"name,unique" json:"name" rpg:"all"`
	Description         *TranslatedString `bun:"description" json:"description" rpg:"all"`
	DefaultPrice        *decimal.Decimal  `bun:"default_price" json:"defaultPrice" rpg:"all"`
	BackdropPhoto       *string           `bun:"backdrop_photo" json:"backdropPhoto" rpg:"all"`
	HeroPhoto           *string           `bun:"hero_photo" json:"heroPhoto" rpg:"all"`

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

func (m *Service) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.service").
		ColumnExpr("service.*")
}

func ServiceLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "ServiceLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			lang := ctxHelpers.GetLanguageFromContext(ctx)
			return "service_label.name->>'" + lang + "' AS \"service_label\""
		},
		Join: "LEFT JOIN core.service AS service_label ON service_label.id = %s.service_id",
	})
}

func (*Service) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.Name}}",
	}
}
