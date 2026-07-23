package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Preference struct {
	bun.BaseModel `bun:"table:notification.preference,alias:preference"`

	Id                string          `bun:"id,pk,nullzero" json:"id"`
	UserId            string          `bun:"user_id,notnull" json:"userId"`
	EventTypeKey      string          `bun:"event_type_key,notnull" json:"eventTypeKey"`
	DeliveryMechanism int             `bun:"delivery_mechanism,notnull" json:"deliveryMechanism"`
	IsEnabled         bool            `bun:"enabled,notnull" json:"enabled"`
	LanguageCode      string          `bun:"language,notnull" json:"language"`
	UserLabel         *string         `bun:"user_label" json:"userLabel"`
	UserEmail         *string         `bun:"user_email" json:"userEmail"`
	UserPhone         *string         `bun:"user_phone" json:"userPhone"`
	CreatedAt         unix.Timestamp  `bun:"created_at,notnull" json:"createdAt"`
	CreatedBy         string          `bun:"created_by,notnull" json:"createdBy"`
	UpdatedAt         *unix.Timestamp `bun:"updated_at" json:"updatedAt"`
	UpdatedBy         *string         `bun:"updated_by" json:"updatedBy"`
	DeletedAt         *unix.Timestamp `bun:"deleted_at" json:"deletedAt"`
	DeletedBy         *string         `bun:"deleted_by" json:"deletedBy"`
}

func (m *Preference) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("notification.preference AS preference").
		ColumnExpr("preference.*")
}
