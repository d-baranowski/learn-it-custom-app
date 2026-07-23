package model

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type IssuesAndSuggestionsComment struct {
	Id        string         `json:"id"`
	UserId    string         `json:"userId"`
	UserLabel string         `json:"userLabel"`
	Text      string         `json:"text"`
	CreatedAt unix.Timestamp `json:"createdAt"`
}

type IssuesAndSuggestionsComments []IssuesAndSuggestionsComment

func (c IssuesAndSuggestionsComments) Value() (driver.Value, error) {
	if c == nil {
		return "[]", nil
	}
	b, err := json.Marshal(c)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (c *IssuesAndSuggestionsComments) Scan(value interface{}) error {
	if value == nil {
		*c = IssuesAndSuggestionsComments{}
		return nil
	}
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, c)
	case string:
		return json.Unmarshal([]byte(v), c)
	default:
		return fmt.Errorf("failed to scan IssuesAndSuggestionsComments: expected []byte or string, got %T", value)
	}
}

type IssuesAndSuggestions struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.issues_and_suggestions,alias:issues_and_suggestions"`

	Id          string                       `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	Title       string                       `bun:"title" json:"title" rpg:"all"`
	Description *string                      `bun:"description" json:"description" rpg:"all"`
	Status      int                          `bun:"status" json:"status" rpg:"all"`
	Comments    IssuesAndSuggestionsComments `bun:"comments,type:jsonb" json:"comments" rpg:"all"`

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

func (m *IssuesAndSuggestions) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.issues_and_suggestions").
		ColumnExpr("issues_and_suggestions.*")
}

func (*IssuesAndSuggestions) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.Title}}",
	}
}
