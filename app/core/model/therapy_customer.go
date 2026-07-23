package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type TherapyCustomer struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.therapy_customer,alias:therapy_customer"`

	Id         string `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapyId  string `bun:"therapy_id,notnull" json:"therapyId" rpg:"all,required"`
	CustomerId string `bun:"customer_id,notnull" json:"customerId" rpg:"all,required"`

	Therapy  *Therapy  `bun:"rel:belongs-to,join:therapy_id=id" json:"-"`
	Customer *Customer `bun:"rel:belongs-to,join:customer_id=id" json:"-"`

	CreatedAt          unix.Timestamp  `json:"createdAt"`
	CreatedAtDateLabel string          `bun:",scanonly" json:"createdAtDateLabel"`
	CreatedBy          string          `json:"createdBy"`
	CreatedByLabel     string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt          *unix.Timestamp `json:"updatedAt"`
	UpdatedAtDateLabel string          `bun:",scanonly" json:"updatedAtDateLabel"`
	UpdatedBy          *string         `json:"updatedBy"`
	UpdatedByLabel     *string         `bun:",scanonly" json:"updatedByLabel"`
}

func (m *TherapyCustomer) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.therapy_customer").
		ColumnExpr("therapy_customer.*")
}
