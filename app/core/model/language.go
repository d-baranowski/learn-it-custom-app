package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Language struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.language,alias:language"`

	Id      string           `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	Name    TranslatedString `bun:"name,notnull" json:"name" rpg:"all,required"`
	IsoCode string           `bun:"iso_code,unique,notnull" json:"isoCode" rpg:"all,required"`

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

func (m *Language) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.language").
		ColumnExpr("language.*")
}

func (*Language) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: repository.AutocompleteTemplateName,
	}
}

func LanguageLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "LanguageLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			lang := ctxHelpers.GetLanguageFromContext(ctx)
			return "language_label.name->>'" + lang + "' AS \"language_label\""
		},
		Join: "left join core.language as language_label on language_label.id = %s.language_id",
	})
}
