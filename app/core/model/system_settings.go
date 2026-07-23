package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type SystemSettings struct {
	bun.BaseModel `bun:"table:core.system_settings,alias:system_settings"`

	Id                            string          `bun:"id,pk,nullzero" json:"id"`
	Version                       int32           `bun:"version,notnull" json:"version"`
	SystemTimezone                string          `bun:"system_timezone,notnull" json:"systemTimezone"`
	SessionDefaultDurationMinutes int32           `bun:"session_default_duration_minutes,notnull" json:"sessionDefaultDurationMinutes"`
	CreatedAt                     unix.Timestamp  `json:"createdAt"`
	CreatedBy                     string          `json:"createdBy"`
	CreatedByLabel                string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt                     *unix.Timestamp `json:"updatedAt"`
	UpdatedBy                     *string         `json:"updatedBy"`
	UpdatedByLabel                *string         `bun:",scanonly" json:"updatedByLabel"`
}

func (m *SystemSettings) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.system_settings").
		ColumnExpr("system_settings.*").
		ColumnExpr("creator.display_name AS created_by_label").
		Join("LEFT JOIN core.user AS creator ON creator.id = system_settings.created_by")
}
