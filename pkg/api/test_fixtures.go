package api

import (
	"context"

	"github.com/uptrace/bun"
	apiv1 "pkg/api/gen/api/v1"
	"pkg/repository"
	"pkg/unix"
	"pkg/util"
)

type TestLabel struct {
	bun.BaseModel `bun:"table:test_label,alias:test_label"`

	ID    string `bun:"id,pk,nullzero" json:"ID"`
	Label string `bun:"label" json:"label"`
}

type TestModel struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:test_model,alias:test_model"`

	ID          string               `bun:"id,pk,nullzero" json:"ID"`
	Name        string               `bun:"name" json:"name"`
	Age         int                  `bun:"age" json:"age"`
	Height      int                  `bun:"height" json:"height"`
	EnumField   apiv1.TestEnum       `json:"enumField"`
	JsonbField  apiv1.TestJsonBField `json:"jsonbField"`
	Foo         int                  `bun:",scanonly" json:"foo"`
	Bar         bool                 `bun:",scanonly" json:"bar"`
	NoUpdate    int                  `bun:"no_update" json:"noUpdate"`
	TestID      string               `bun:"test_id" json:"testID"`
	TestLabel   string               `bun:",scanonly" json:"testLabel" label:"test"`
	TestGroupID string               `bun:"test_group_id" json:"testGroupID"`

	CreatedAt unix.Timestamp  `bun:"created_at,type:bigint" json:"createdAt"`
	CreatedBy string          `bun:"created_by" json:"createdBy"`
	UpdatedAt *unix.Timestamp `bun:"updated_at,type:bigint" json:"updatedAt"`
	UpdatedBy *string         `bun:"updated_by" json:"updatedBy"`
	DeletedAt *unix.Timestamp `bun:"deleted_at,type:bigint" json:"deletedAt"`
	DeletedBy *string         `bun:"deleted_by" json:"deletedBy"`
}

func (r *TestModel) Autocomplete() repository.Autocomplete {
	return repository.Autocomplete{
		Template: repository.AutocompleteTemplateName,
	}
}

func (r *TestModel) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("test_model").
		Column("test_model.*").
		ColumnExpr("1 as foo").
		ColumnExpr("true as bar")
}

type TestEmbeddedModel struct {
	Age    int `bun:"age" json:"age"`
	Height int `bun:"height" json:"height"`
}

type TestGroup struct {
	ID   string  `bun:"id,pk,nullzero" json:"ID"`
	Code *string `bun:"code" json:"code"`
	Name string  `bun:"name" json:"name"`
}

type _testStore struct {
	rows map[string]*TestGroup
}

func (s *_testStore) GetForAutocomplete(id string) (interface{}, bool) {
	conn, ok := s.rows[id]
	if !ok {
		return nil, false
	}

	return conn, true
}

var testStore = &_testStore{
	rows: map[string]*TestGroup{
		"1": {ID: "1", Code: util.ToPtr("A"), Name: "Group 1"},
		"2": {ID: "2", Code: nil, Name: "Group 2"},
	},
}
