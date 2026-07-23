package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Template struct {
	bun.BaseModel `bun:"table:notification.template,alias:notification_template"`

	Id           string          `bun:"id,pk,nullzero" json:"id"`
	EventTypeKey string          `bun:"event_type_key,notnull" json:"eventTypeKey"`
	Title        string          `bun:"title,notnull" json:"title"`
	Description  *string         `bun:"description" json:"description"`
	Active       bool            `bun:"active,notnull" json:"active"`
	CreatedAt    unix.Timestamp  `bun:"created_at,notnull" json:"createdAt"`
	CreatedBy    string          `bun:"created_by,notnull" json:"createdBy"`
	UpdatedAt    *unix.Timestamp `bun:"updated_at" json:"updatedAt"`
	UpdatedBy    *string         `bun:"updated_by" json:"updatedBy"`
	DeletedAt    *unix.Timestamp `bun:"deleted_at" json:"deletedAt"`
	DeletedBy    *string         `bun:"deleted_by" json:"deletedBy"`

	Variants []*TemplateVariant `bun:"rel:has-many,join:id=template_id" json:"variants,omitempty"`
}

func (m *Template) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("notification.template AS notification_template").
		ColumnExpr("notification_template.*")
}
