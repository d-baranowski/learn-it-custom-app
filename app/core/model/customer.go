package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Customer struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.customer,alias:customer"`

	Id                  string  `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	DisplayAbbreviation *string `bun:"display_abbreviation" json:"displayAbbreviation" rpg:"all"`
	UserId              *string `bun:"user_id" json:"userId" rpg:"all"`
	UserLabel           *string `bun:",scanonly" json:"userLabel" rpg:"list"`
	FirstName           *string `bun:"first_name" json:"firstName" rpg:"all"`
	LastName            *string `bun:"last_name" json:"lastName" rpg:"all"`
	Address             *string `bun:"address" json:"address" rpg:"all"`
	Email               *string `bun:"email" json:"email" rpg:"all"`
	PhoneNumber         *string `bun:"phone_number" json:"phoneNumber" rpg:"all"`
	Notes               *string `bun:"notes" json:"notes" rpg:"all"`
	LanguageId          *string `bun:"language_id" json:"languageId" rpg:"all"`
	LanguageLabel       *string `bun:",scanonly" json:"languageLabel" rpg:"list"`
	TherapistLabels     *string `bun:",scanonly" json:"therapistLabels" rpg:"list"`

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

func (m *Customer) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.customer").
		ColumnExpr("customer.*").
		ColumnExpr(`(SELECT string_agg(COALESCE(tu.display_name, ''), ', ' ORDER BY tu.display_name)
			FROM core.therapist_customer tc
			JOIN core.therapist t ON t.id = tc.therapist_id AND t.deleted_at IS NULL
			JOIN core."user" tu ON tu.id = t.user_id
			WHERE tc.customer_id = customer.id AND tc.deleted_at IS NULL) AS therapist_labels`)
}

func (*Customer) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.LastName}} {{.FirstName}}",
	}
}

func CustomerLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "CustomerLabel", repository.LabelerConfigEntry{
		Column: "COALESCE(customer_label.last_name, '') || ' ' || COALESCE(customer_label.first_name, '') as customer_label",
		Join:   "LEFT JOIN core.customer AS customer_label ON customer_label.id = %s.customer_id",
	})
}
