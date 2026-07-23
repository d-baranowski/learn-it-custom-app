package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Permission struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.permission,alias:permission"`

	Id        string   `bun:"id,pk,nullzero" json:"id"`
	RoleId    *string  `json:"roleId"`
	RoleLabel *string  `bun:",scanonly" json:"roleLabel"`
	UserId    *string  `json:"userId"`
	UserLabel *string  `bun:",scanonly" json:"userLabel"`
	Key       string   `json:"key"`
	Abilities []string `bun:",array" json:"abilities"`
	Scope     int32    `json:"scope"` // 0=UNSPECIFIED, 1=OWN, 2=ALL
	Revoke    bool     `json:"revoke"`

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

func (*Permission) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.permission").
		Column("permission.*")
}
