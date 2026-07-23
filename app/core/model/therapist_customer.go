package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type TherapistCustomer struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.therapist_customer,alias:therapist_customer"`

	Id             string  `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapistId    string  `bun:"therapist_id" json:"therapistId" rpg:"all,required"`
	TherapistLabel *string `bun:",scanonly" json:"therapistLabel"  rpg:"get,list,search,filter"`
	CustomerId     string  `bun:"customer_id" json:"customerId" rpg:"all,required"`
	CustomerLabel  *string `bun:",scanonly" json:"customerLabel"  rpg:"get,list,search,filter"`

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

func (*TherapistCustomer) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.therapist_customer").
		ColumnExpr("therapist_customer.*")
}

func (*TherapistCustomer) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.TherapistLabel}} - {{.CustomerLabel}}",
	}
}
