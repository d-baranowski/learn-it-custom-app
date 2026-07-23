package model

import (
	"context"
	"fmt"
	"pkg/repository"
	"pkg/unix"
	"strings"

	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrPermissionDenied = fmt.Errorf("password is required")
)

type User struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.user,alias:user"`

	Id                  string  `bun:"id,pk,nullzero" json:"id"`
	Username            string  `json:"username"`
	DisplayName         *string `json:"displayName"`
	DisplayAbbreviation *string `json:"displayAbbreviation"`
	Email               *string `json:"email"`
	PasswordHash        string  `json:"passwordHash"`
	ExternalId          string  `json:"externalId"`
	Avatar              string  `json:"avatar"`
	Disabled            bool    `json:"disabled"`
	ResetPass           bool    `json:"resetPass"`

	UserRolesLabel string `bun:",scanonly" json:"userRolesLabel"`
	UserTeamsLabel string `bun:",scanonly" json:"userTeamsLabel"`

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

func (e *User) SetPassword(password *string) error {
	if password == nil {
		return ErrPermissionDenied
	}

	trimmed := strings.TrimSpace(*password)
	if trimmed == "" {
		return ErrPermissionDenied
	}

	hashPass, err := bcrypt.GenerateFromPassword([]byte(trimmed), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	e.PasswordHash = string(hashPass)

	return nil
}

func (*User) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.user").
		Column("user.*")
}

func (*User) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}}",
	}
}

func UserLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "UserLabel", repository.LabelerConfigEntry{
		Column: "user_label.display_name as user_label",
		Join:   "left join core.user as user_label on user_label.id = %s.user_id",
	})
}

func UserAbbreviationLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "UserAbbreviationLabel", repository.LabelerConfigEntry{
		Column: "user_abbreviation_label.display_abbreviation as user_abbreviation_label",
		Join:   "left join core.user as user_abbreviation_label on user_abbreviation_label.id = %s.user_id",
	})
}
