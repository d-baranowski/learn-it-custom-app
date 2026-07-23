package model

import (
	"context"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type UserTeam struct {
	bun.BaseModel `bun:"table:core.user_team,alias:user_team"`

	Id        string `bun:"id,pk,nullzero" json:"id"`
	UserId    string `json:"userId"`
	UserLabel string `bun:",scanonly" json:"userLabel"`
	TeamId    string `json:"teamId"`
	TeamLabel string `bun:",scanonly" json:"teamLabel"`

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

func (m *UserTeam) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().Model(m)
}

func UserTeamsLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "UserTeamsLabel", repository.LabelerConfigEntry{
		Column: "(select string_agg(team.name, ',') from core.user_team ut join core.team team on team.id = ut.team_id where ut.user_id = %s.id) as user_teams_label",
	})
}
