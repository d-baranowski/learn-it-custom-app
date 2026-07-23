package model

import (
	"github.com/jackc/pgtype"
	"github.com/uptrace/bun"
	"pkg/unix"
)

type UserSetting struct {
	bun.BaseModel `bun:"table:core.user_setting,alias:user_setting"`

	Id      string `bun:"id,pk,nullzero" json:"id"`
	UserId  string
	Token   string
	Data    *pgtype.JSONB
	Expires unix.Timestamp
}
