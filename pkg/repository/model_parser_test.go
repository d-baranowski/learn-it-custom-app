package repository

import (
	"context"
	"pkg/ctxHelpers"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/schema"
)

type SimpleModel struct {
	bun.BaseModel `bun:"table:simple_models"`

	ID   int64  `bun:",pk" json:"id"`
	Name string `bun:"name" json:"name"`
	Age  *int   `bun:"age" json:"age,omitempty"`
}

type EmbeddedFields struct {
	CreatedAt string `bun:"created_at" json:"createdAt"`
	UpdatedAt string `bun:"updated_at" json:"updatedAt"`
}

type ModelWithEmbedded struct {
	bun.BaseModel `bun:"table:models_with_embedded"`

	ID             int64  `bun:",pk" json:"id"`
	Name           string `bun:"name" json:"name"`
	EmbeddedFields `bun:",embed"`
}

type JsonBField struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ModelWithJsonB struct {
	bun.BaseModel `bun:"table:models_with_jsonb"`

	ID       int64      `bun:",pk" json:"id"`
	Metadata JsonBField `bun:"metadata,type:jsonb" json:"metadata"`
}

type ModelWithView struct {
	bun.BaseModel `bun:"table:models_with_view"`

	ID   int64  `bun:",pk" json:"id"`
	Name string `bun:"name" json:"name"`
}

func (m *ModelWithView) View(ctx context.Context) *bun.SelectQuery {
	// Mock query - in real implementation this would return actual query
	return nil
}

type ModelWithExcludedField struct {
	bun.BaseModel `bun:"table:models_excluded"`

	ID       int64  `bun:",pk" json:"id"`
	Name     string `bun:"name" json:"name"`
	Internal string `bun:"-" json:"-"`
}

func TestParseModel_SimpleModel(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleModel)(nil))
	mp := ModelParserProvider(tables)

	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleModel{}
	parsed, err := mp.ParseModel(ctx, model)

	require.NoError(t, err)
	require.NotNil(t, parsed)

	assert.Equal(t, "en", parsed.Language)
	assert.False(t, parsed.IsJsonB)
	assert.NotNil(t, parsed.BunTable)

	// Check fields
	fields := parsed.GetRpcFields()
	assert.Len(t, fields, 3) // ID, Name, Age

	// Check ID field
	idField := fields[0]
	assert.Equal(t, "ID", idField.GoName)
	assert.Equal(t, "id", idField.RpcName)
	assert.Equal(t, "int64", idField.Type)

	// Check Name field
	nameField := fields[1]
	assert.Equal(t, "Name", nameField.GoName)
	assert.Equal(t, "name", nameField.RpcName)
	assert.Equal(t, "string", nameField.Type)

	// Check Age field (pointer)
	ageField := fields[2]
	assert.Equal(t, "Age", ageField.GoName)
	assert.Equal(t, "age", ageField.RpcName)
	assert.Equal(t, "int", ageField.Type)
}

func TestParseModel_WithEmbedded(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*ModelWithEmbedded)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &ModelWithEmbedded{}
	parsed, err := mp.ParseModel(ctx, model)

	require.NoError(t, err)
	require.NotNil(t, parsed)

	// Check that embedded fields are flattened
	fields := parsed.GetRpcFields()
	assert.Len(t, fields, 4) // ID, Name, CreatedAt, UpdatedAt

	fieldNames := make([]string, len(fields))
	for i, f := range fields {
		fieldNames[i] = f.GoName
	}

	assert.Contains(t, fieldNames, "ID")
	assert.Contains(t, fieldNames, "Name")
	assert.Contains(t, fieldNames, "CreatedAt")
	assert.Contains(t, fieldNames, "UpdatedAt")
}

func TestParseModel_WithJsonB(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &ModelWithJsonB{}
	parsed, err := mp.ParseModel(ctx, model)

	require.NoError(t, err)
	require.NotNil(t, parsed)

	fields := parsed.GetRpcFields()

	// Find metadata field
	var metadataField *ModelField
	for _, f := range fields {
		if f.GoName == "Metadata" {
			metadataField = f
			break
		}
	}

	require.NotNil(t, metadataField)
	assert.True(t, metadataField.IsJsonB)
	assert.NotNil(t, metadataField.Model)

	// Check nested model fields
	nestedFields := metadataField.Model.GetRpcFields()
	assert.Len(t, nestedFields, 2) // Key, Value
}

func TestParseModel_WithExcludedField(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &ModelWithExcludedField{}
	parsed, err := mp.ParseModel(ctx, model)

	require.NoError(t, err)
	require.NotNil(t, parsed)

	fields := parsed.GetRpcFields()

	// Internal field should be excluded
	for _, f := range fields {
		assert.NotEqual(t, "Internal", f.GoName)
	}
}

func TestParseModel_Caching(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleModel{}

	// Parse first time
	parsed1, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)

	// Parse second time - should use cache
	parsed2, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)

	// Should return same instance from cache
	assert.Equal(t, parsed1, parsed2)
}

func TestParseModel_DifferentLanguages(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)
	model := &SimpleModel{}

	// Parse with English
	ctxEn := ctxHelpers.SetLanguageInContext(context.Background(), "en")
	parsedEn, err := mp.ParseModel(ctxEn, model)
	require.NoError(t, err)
	assert.Equal(t, "en", parsedEn.Language)

	// Parse with Polish
	ctxPl := ctxHelpers.SetLanguageInContext(context.Background(), "pl")
	parsedPl, err := mp.ParseModel(ctxPl, model)
	require.NoError(t, err)
	assert.Equal(t, "pl", parsedPl.Language)

	// Should be different instances
	assert.NotEqual(t, parsedEn, parsedPl)
}

func TestParseModel_NilModel(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)

	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	parsed, err := mp.ParseModel(ctx, nil)

	assert.Error(t, err)
	assert.Nil(t, parsed)
	assert.Contains(t, err.Error(), "must not be nil")
}

// ModelWithPointerJsonB tests that a pointer-to-struct field is detected as JSONB.
// This covers the bug where *TranslatedString fields (used for multilingual columns
// like ProfessionalTitle) were not marked IsJsonB, causing ILIKE to be applied
// directly to the JSONB column and crashing with "operator does not exist: jsonb ~~*".
type ModelWithPointerJsonB struct {
	bun.BaseModel `bun:"table:models_with_ptr_jsonb"`

	ID       int64       `bun:",pk" json:"id"`
	Metadata *JsonBField `bun:"metadata" json:"metadata"`
}

func TestParseModel_WithPointerToStructJsonB(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &ModelWithPointerJsonB{}
	parsed, err := mp.ParseModel(ctx, model)

	require.NoError(t, err)
	require.NotNil(t, parsed)

	fields := parsed.GetRpcFields()

	var metadataField *ModelField
	for _, f := range fields {
		if f.GoName == "Metadata" {
			metadataField = f
			break
		}
	}

	require.NotNil(t, metadataField)
	assert.True(t, metadataField.IsJsonB, "pointer-to-struct field must be detected as JSONB")
	assert.NotNil(t, metadataField.Model)

	nestedFields := metadataField.Model.GetRpcFields()
	assert.Len(t, nestedFields, 2) // Key, Value
}
