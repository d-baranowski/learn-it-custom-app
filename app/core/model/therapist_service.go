package model

import (
	"context"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type TherapistService struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.therapist_service,alias:therapist_service"`

	Id             string           `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapistId    string           `bun:"therapist_id" json:"therapistId" rpg:"all,required"`
	TherapistLabel *string          `bun:",scanonly" json:"therapistLabel"  rpg:"get,list,search,filter"`
	ServiceId      string           `bun:"service_id" json:"serviceId" rpg:"all,required"`
	ServiceLabel   *string          `bun:",scanonly" json:"serviceLabel"  rpg:"get,list,search,filter"`
	Price          *decimal.Decimal `bun:"price" json:"price" rpg:"all"`

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

func (*TherapistService) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.therapist_service").
		ColumnExpr("therapist_service.*")
}

func (*TherapistService) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.ServiceLabel}}",
	}
}
