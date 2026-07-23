package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Room struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.room,alias:room"`

	Id                  string            `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	OfficeId            string            `bun:"office_id,notnull" json:"officeId" rpg:"all,required"`
	OfficeLabel         string            `bun:",scanonly" json:"officeLabel" rpg:"get,list,search,filter"`
	DisplayName         TranslatedString  `bun:"display_name" json:"displayName" rpg:"all"`
	DisplayAbbreviation *string           `bun:"display_abbreviation" json:"displayAbbreviation" rpg:"all"`
	DisplayColor        *string           `bun:"display_color" json:"displayColor" rpg:"all"`
	Description         *TranslatedString `bun:"description" json:"description" rpg:"all"`

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

func (m *Room) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.room").
		ColumnExpr("room.*")
}

func RoomLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "RoomLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			lang := ctxHelpers.GetLanguageFromContext(ctx)
			return "room_label.display_name->>'" + lang + "' AS \"room_label\""
		},
		Join: "LEFT JOIN core.room AS room_label ON room_label.id = %s.room_id",
	})
}

func (*Room) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}}",
	}
}
