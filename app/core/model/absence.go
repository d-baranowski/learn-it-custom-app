package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Absence struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.absence,alias:absence"`

	Id          string         `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapistId *string        `bun:"therapist_id" json:"therapistId" rpg:"all"` // Nullable for organization-wide absences
	FromTime    unix.Timestamp `bun:"from_time,notnull" json:"fromTime" rpg:"all"`
	TillTime    unix.Timestamp `bun:"till_time,notnull" json:"tillTime" rpg:"all"`
	Reason      *string        `bun:"reason" json:"reason" rpg:"all"`

	TherapistLabel             *string `bun:",scanonly" json:"therapistLabel" rpg:"list"`
	TherapistAbbreviationLabel *string `bun:",scanonly" json:"therapistAbbreviationLabel" rpg:"list"`

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

func (m *Absence) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.absence").
		ColumnExpr("absence.*")
}
