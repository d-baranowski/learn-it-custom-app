package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Role struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.role,alias:role"`

	Id          string `bun:"id,pk,nullzero" json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`

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

func (*Role) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: repository.AutocompleteTemplateName,
	}
}

func (*Role) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.role").
		Column("role.*")
}

func RoleLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "RoleLabel", repository.LabelerConfigEntry{
		Column: "role_label.name as role_label",
		Join:   "left join core.role as role_label on role_label.id = %s.role_id",
	})
}
