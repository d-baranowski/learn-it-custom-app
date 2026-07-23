package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"
	"strings"

	"github.com/uptrace/bun"
)

var _ bun.BeforeAppendModelHook = (*UserRole)(nil)

type UserRole struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.user_role,alias:user_role"`

	Id        string          `bun:"id,pk,nullzero" json:"id"`
	UserId    string          `json:"userId"`
	UserLabel string          `bun:",scanonly" json:"userLabel"`
	RoleId    string          `json:"roleId"`
	RoleLabel string          `bun:",scanonly" json:"roleLabel"`
	ExpiresAt *unix.Timestamp `json:"expiresAt"`

	CreatedAt          unix.Timestamp  `json:"createdAt"`
	CreatedAtDateLabel string          `bun:",scanonly" json:"createdAtDateLabel"`
	CreatedBy          string          `json:"createdBy"`
	CreatedByLabel     string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt          *unix.Timestamp `json:"updatedAt"`
	UpdatedAtDateLabel string          `bun:",scanonly" json:"updatedAtDateLabel"`
	UpdatedBy          *string         `json:"updatedBy"`
	UpdatedByLabel     *string         `bun:",scanonly" json:"updatedByLabel"`
}

func (m *UserRole) BeforeUpdate(ctx context.Context, query *bun.UpdateQuery) error {
	if ctxHelpers.GetApiContext(ctx) {
		query.Column("expires_at")
	}

	return nil
}

func (m *UserRole) BeforeAppendModel(_ context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		if strings.HasPrefix(m.Id, "NEW") {
			// nullzero
			m.Id = ""
		}
	}
	return nil
}

func (*UserRole) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.user_role").
		Column("user_role.*")
}

func UserRolesLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "UserRolesLabel", repository.LabelerConfigEntry{
		Column: "(select string_agg(role.name, ',') from core.user_role ur join core.role role on role.id = ur.role_id where ur.user_id = %s.id and (ur.expires_at is null or ur.expires_at > core.unix_timestamp())) as user_roles_label",
	})
}
