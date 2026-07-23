package model

import (
	"github.com/uptrace/bun"
	"pkg/repository"
)

type UserLock struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.user_lock,alias:user_lock"`

	Id        string `bun:"id,pk,nullzero" json:"id"`
	EntityId  string `json:"entityId"`
	UserId    string `json:"userId"`
	CreatedAt *int64 `bun:",nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt *int64 `bun:",nullzero,notnull,default:current_timestamp" json:"updatedAt"`
	ExpiresAt *int64 `json:"expiresAt"`
}
