package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type WorkingHours struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.working_hours,alias:working_hours"`

	Id          string `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapistId string `bun:"therapist_id,notnull" json:"therapistId" rpg:"all"`
	DayOfWeek   int    `bun:"day_of_week,notnull" json:"dayOfWeek" rpg:"all"` // Monday=1 through Sunday=7
	FromTime    string `bun:"from_time,notnull,type:time" json:"fromTime" rpg:"all"`
	TillTime    string `bun:"till_time,notnull,type:time" json:"tillTime" rpg:"all"`

	TherapistLabel             string  `bun:",scanonly" json:"therapistLabel" rpg:"list"`
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

func (m *WorkingHours) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.working_hours").
		ColumnExpr("working_hours.*")
}
