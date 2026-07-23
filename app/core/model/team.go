package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Team struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.team,alias:team"`

	Id          string          `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Users       []*TeamViewUser `json:"users"`

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

type TeamViewUser struct {
	Id    string `json:"Id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (*Team) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().NewSelect().
		Model(&Team{}).
		TableExpr("core.team AS t").
		ColumnExpr("t.*, cu.display_name AS created_by_name, cu.email AS created_by_email").
		ColumnExpr("uu.display_name AS updated_by_name, uu.email AS updated_by_email").
		ColumnExpr("du.display_name AS deleted_by_name, du.email AS deleted_by_email").
		ColumnExpr(`(
			SELECT json_agg(json_build_object(
				'ID', u.id,
				'name', u.name,
				'email', u.email
			))
			FROM core.user_team ut
			LEFT JOIN core.user u ON ut.user_id = u.id
			WHERE ut.team_id = t.id
		) AS users`).
		Join("LEFT JOIN core.user AS cu ON t.created_by = cu.id").
		Join("LEFT JOIN core.user AS uu ON t.updated_by = uu.id").
		Join("LEFT JOIN core.user AS du ON t.deleted_by = du.id")
}

func TeamLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "TeamLabel", repository.LabelerConfigEntry{
		Column: "team_label.name as team_label",
		Join:   "left join core.team as team_label on team_label.id = %s.team_id",
	})
}
