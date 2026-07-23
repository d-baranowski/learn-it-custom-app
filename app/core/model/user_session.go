package model

import (
	"github.com/uptrace/bun"
	"pkg/unix"
)

type UserSession struct {
	bun.BaseModel `bun:"table:core.user_session,alias:user_session"`

	Id        string         `bun:"id,pk,nullzero" json:"id"`
	UserId    string         `json:"userId"`
	CreatedAt unix.Timestamp `json:"createdAt"`
	Expires   unix.Timestamp `json:"expires"`
}
