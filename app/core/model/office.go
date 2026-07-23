package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Office struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.office,alias:office"`

	Id          string           `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	DisplayName TranslatedString `bun:"display_name" json:"displayName" rpg:"all"`
	Address     string           `bun:"address,notnull" json:"address" rpg:"all"`

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

func (m *Office) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.office").
		ColumnExpr("office.*")
}

func OfficeLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "OfficeLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			lang := ctxHelpers.GetLanguageFromContext(ctx)
			return "office_label.display_name->>'" + lang + "' AS \"office_label\""
		},
		Join: "LEFT JOIN core.office AS office_label ON office_label.id = %s.office_id",
	})
}

func (*Office) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}}",
	}
}
