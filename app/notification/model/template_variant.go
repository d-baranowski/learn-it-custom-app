package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type TemplateVariant struct {
	bun.BaseModel `bun:"table:notification.template_variant,alias:template_variant"`

	Id                string          `bun:"id,pk,nullzero" json:"id"`
	TemplateId        string          `bun:"template_id,notnull" json:"templateId"`
	Language          string          `bun:"language,notnull" json:"language"`
	DeliveryMechanism int            `bun:"delivery_mechanism,notnull" json:"deliveryMechanism"`
	Subject           *string         `bun:"subject" json:"subject"`
	Body              string          `bun:"body,notnull" json:"body"`
	CreatedAt         unix.Timestamp  `bun:"created_at,notnull" json:"createdAt"`
	CreatedBy         string          `bun:"created_by,notnull" json:"createdBy"`
	UpdatedAt         *unix.Timestamp `bun:"updated_at" json:"updatedAt"`
	UpdatedBy         *string         `bun:"updated_by" json:"updatedBy"`
	DeletedAt         *unix.Timestamp `bun:"deleted_at" json:"deletedAt"`
	DeletedBy         *string         `bun:"deleted_by" json:"deletedBy"`
}

func (m *TemplateVariant) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("notification.template_variant AS template_variant").
		ColumnExpr("template_variant.*")
}
