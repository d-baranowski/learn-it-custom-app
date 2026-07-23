package model

import (
	"github.com/uptrace/bun"
	"pkg/repository"
)

type UserPermission struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.user_permission,alias:user_permission"`

	UserId  string   `bun:",pk" json:"userId"`
	Key     string   `bun:",pk" json:"key"`
	Allowed []string `bun:",array" json:"abilities"`
}
