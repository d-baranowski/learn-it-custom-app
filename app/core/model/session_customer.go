package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type SessionCustomer struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.session_customer,alias:session_customer"`

	Id         string `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	SessionId  string `bun:"session_id,notnull" json:"sessionId" rpg:"all,required"`
	CustomerId string `bun:"customer_id,notnull" json:"customerId" rpg:"all,required"`

	Session  *Session  `bun:"rel:belongs-to,join:session_id=id" json:"-"`
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

func (m *SessionCustomer) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.session_customer").
		ColumnExpr("session_customer.*")
}
