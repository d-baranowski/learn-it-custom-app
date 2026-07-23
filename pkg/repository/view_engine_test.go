package repository

import (
	"context"
	"fmt"
	"pkg/ctxHelpers"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/schema"
)

type SimpleViewModel struct {
	bun.BaseModel `bun:"table:simple_view_models"`

	ID   int64  `bun:",pk" json:"id"`
	Name string `bun:"name" json:"name"`
}

func (m *SimpleViewModel) View(ctx context.Context) *bun.SelectQuery {
	db := NoopDB // Mock DB for testing
	return db.NewSelect().
		TableExpr("simple_view_models").
		Column("id", "name").
		Where("deleted_at IS NULL")
}

type TranslatedViewModel struct {
	bun.BaseModel `bun:"table:translated_view_models"`

	ID          int64  `bun:",pk" json:"id"`
	Name        string `bun:"name" json:"name"`
	Description string `bun:"description" json:"description"`
}

func (m *TranslatedViewModel) View(ctx context.Context) *bun.SelectQuery {
	db := NoopDB // Mock DB for testing
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	return db.NewSelect().
		TableExpr("translated_view_models AS t").
		Column("t.id", "t.name").
		ColumnExpr("COALESCE(tr.description, t.description) AS description").
		Join("LEFT JOIN translations tr ON tr.entity_id = t.id").
		Where("tr.language = ?", lang).
		Where("t.deleted_at IS NULL")
}

type JoinedViewModel struct {
	bun.BaseModel `bun:"table:joined_view_models"`

	ID         int64  `bun:",pk" json:"id"`
	Name       string `bun:"name" json:"name"`
	CategoryID int64  `bun:"category_id" json:"categoryId"`
	Category   string `bun:"category" json:"category"`
}

func (m *JoinedViewModel) View(ctx context.Context) *bun.SelectQuery {
	db := NoopDB // Mock DB for testing

	return db.NewSelect().
		TableExpr("joined_view_models AS jvm").
		Column("jvm.id", "jvm.name", "jvm.category_id").
		ColumnExpr("c.name AS category").
		Join("INNER JOIN categories c ON c.id = jvm.category_id").
		Where("jvm.active = ?", true)
}

type AggregatedViewModel struct {
	bun.BaseModel `bun:"table:aggregated_view_models"`

	ID    int64  `bun:",pk" json:"id"`
	Name  string `bun:"name" json:"name"`
	Count int    `bun:"count" json:"count"`
}

func (m *AggregatedViewModel) View(ctx context.Context) *bun.SelectQuery {
	db := NoopDB // Mock DB for testing

	return db.NewSelect().
		TableExpr("aggregated_view_models AS avm").
		Column("avm.id", "avm.name").
		ColumnExpr("COUNT(items.id) AS count").
		Join("LEFT JOIN items ON items.parent_id = avm.id").
		Group("avm.id", "avm.name").
		Having("COUNT(items.id) > ?", 0)
}

func TestViewEngine_GetView_SimpleModel(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleViewModel)(nil))
	mp := ModelParserProvider(tables)

	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	expectedSQL := `SELECT "id", "name" FROM simple_view_models WHERE (deleted_at IS NULL)`
	actualSQL := parsedModel.View.Query.String()

	assert.Equal(t, expectedSQL, actualSQL)
}

func TestViewEngine_GetView_WithTranslations(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*TranslatedViewModel)(nil))
	mp := ModelParserProvider(tables)

	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "pl")

	model := &TranslatedViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	expectedSQL := `SELECT "t"."id", "t"."name", COALESCE(tr.description, t.description) AS description FROM translated_view_models AS t LEFT JOIN translations tr ON tr.entity_id = t.id WHERE (tr.language = 'pl') AND (t.deleted_at IS NULL)`
	actualSQL := parsedModel.View.Query.String()

	assert.Equal(t, expectedSQL, actualSQL)
}

func TestViewEngine_GetView_WithJoins(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*JoinedViewModel)(nil))
	mp := ModelParserProvider(tables)

	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &JoinedViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	expectedSQL := `SELECT "jvm"."id", "jvm"."name", "jvm"."category_id", c.name AS category FROM joined_view_models AS jvm INNER JOIN categories c ON c.id = jvm.category_id WHERE (jvm.active = TRUE)`
	actualSQL := parsedModel.View.Query.String()

	assert.Equal(t, expectedSQL, actualSQL)
}

func TestViewEngine_GetView_WithAggregation(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*AggregatedViewModel)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &AggregatedViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	expectedSQL := `SELECT "avm"."id", "avm"."name", COUNT(items.id) AS count FROM aggregated_view_models AS avm LEFT JOIN items ON items.parent_id = avm.id GROUP BY "avm"."id", "avm"."name" HAVING (COUNT(items.id) > 0)`
	actualSQL := parsedModel.View.Query.String()

	assert.Equal(t, expectedSQL, actualSQL)
}

func TestViewEngine_ViewVersioning(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleViewModel)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	m := &SimpleViewModel{}
	parsedModel1, err := mp.ParseModel(ctx, m)
	require.NoError(t, err)

	// Version should be generated
	assert.NotEmpty(t, parsedModel1.View.Version)
	assert.LessOrEqual(t, len(parsedModel1.View.Version), 12)

	// Same model should have same version
	model2 := &SimpleViewModel{}
	parsedModel2, err := mp.ParseModel(ctx, model2)
	require.NoError(t, err)

	assert.Equal(t, parsedModel1.View.Version, parsedModel2.View.Version)
}

func TestViewEngine_ViewTableExpr(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleViewModel)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	tableExpr := parsedModel.View.TableExpr(ctx)

	// Should contain schema, table name, and version
	assert.Contains(t, tableExpr, "simple_view_models")
	assert.Contains(t, tableExpr, parsedModel.View.Version)
}

func TestViewEngine_DifferentLanguages_DifferentViews(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*TranslatedViewModel)(nil))
	mp := ModelParserProvider(tables)
	modelEn := &TranslatedViewModel{}
	ctxEn := ctxHelpers.SetLanguageInContext(context.Background(), "en")
	parsedEn, err := mp.ParseModel(ctxEn, modelEn)
	require.NoError(t, err)

	modelPl := &TranslatedViewModel{}
	ctxPl := ctxHelpers.SetLanguageInContext(context.Background(), "pl")
	parsedPl, err := mp.ParseModel(ctxPl, modelPl)
	require.NoError(t, err)

	sqlEn := parsedEn.View.Query.String()
	sqlPl := parsedPl.View.Query.String()

	// Different languages should produce different SQL
	assert.NotEqual(t, sqlEn, sqlPl)
	assert.Contains(t, sqlEn, "'en'")
	assert.Contains(t, sqlPl, "'pl'")
}

func TestViewEngine_CreateViewStatement(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleViewModel)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	expectedPrefix := "create view " + parsedModel.View.TableExpr(ctx) + " AS "
	expectedSQL := expectedPrefix + parsedModel.View.Query.String()

	// This is what ViewEngine.UseView would execute
	assert.Contains(t, expectedSQL, "create view")
	assert.Contains(t, expectedSQL, "simple_view_models")
	assert.Contains(t, expectedSQL, `SELECT "id", "name" FROM simple_view_models WHERE (deleted_at IS NULL)`)
}

func TestViewEngine_DropViewStatement(t *testing.T) {
	dialect := pgdialect.New()
	tables := schema.NewTables(dialect)
	// Prepopulate bun tables with the model definitions used in this test.
	tables.Register((*SimpleViewModel)(nil))
	mp := ModelParserProvider(tables)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model := &SimpleViewModel{}
	parsedModel, err := mp.ParseModel(ctx, model)
	require.NoError(t, err)
	require.NotNil(t, parsedModel.View)
	require.NotNil(t, parsedModel.BunTable)

	dropSQL := "drop view if exists " + parsedModel.View.TableExpr(ctx)

	assert.Contains(t, dropSQL, "drop view if exists")
	assert.Contains(t, dropSQL, "simple_view_models")
}

// ExtendedSimpleViewModel has an additional column compared to SimpleViewModel.
// Both use the same View() SQL ("SELECT * FROM simple_view_models WHERE ..."),
// but the extra field must produce a different version hash.
type ExtendedSimpleViewModel struct {
	bun.BaseModel `bun:"table:simple_view_models"`

	ID    int64  `bun:",pk" json:"id"`
	Name  string `bun:"name" json:"name"`
	Email string `bun:"email" json:"email"`
}

func (m *ExtendedSimpleViewModel) View(ctx context.Context) *bun.SelectQuery {
	db := NoopDB
	return db.NewSelect().
		TableExpr("simple_view_models").
		Column("id", "name").
		Where("deleted_at IS NULL")
}

func TestViewEngine_FieldFingerprint_DifferentFieldsProduceDifferentVersion(t *testing.T) {
	dialect := pgdialect.New()

	// Parse the original model.
	tables1 := schema.NewTables(dialect)
	tables1.Register((*SimpleViewModel)(nil))
	mp1 := ModelParserProvider(tables1)
	ctx := ctxHelpers.SetLanguageInContext(context.Background(), "en")

	model1 := &SimpleViewModel{}
	parsed1, err := mp1.ParseModel(ctx, model1)
	require.NoError(t, err)
	require.NotEmpty(t, parsed1.View.Version)

	// Parse the extended model (same View() SQL, extra field).
	tables2 := schema.NewTables(dialect)
	tables2.Register((*ExtendedSimpleViewModel)(nil))
	mp2 := ModelParserProvider(tables2)

	model2 := &ExtendedSimpleViewModel{}
	parsed2, err := mp2.ParseModel(ctx, model2)
	require.NoError(t, err)
	require.NotEmpty(t, parsed2.View.Version)

	// The versions MUST differ because the field list is different,
	// even though the SQL query string is identical.
	assert.NotEqual(t, parsed1.View.Version, parsed2.View.Version,
		"adding a field to the model must change the view version hash")

	// Sanity-check: the SQL queries are indeed identical.
	assert.Equal(t, parsed1.View.Query.String(), parsed2.View.Query.String(),
		"both models should produce the same SQL query")
}

func TestViewEngine_IsUndefinedTableError(t *testing.T) {
	// Test with a pgconn.PgError with code 42P01
	pgErr := &pgconn.PgError{Code: "42P01", Message: "relation does not exist"}
	assert.True(t, IsUndefinedTableError(pgErr))

	// Test with a generic error containing "does not exist"
	genericErr := fmt.Errorf("relation \"core.session_abc123_en\" does not exist")
	assert.True(t, IsUndefinedTableError(genericErr))

	// Test with an unrelated error
	otherErr := fmt.Errorf("connection refused")
	assert.False(t, IsUndefinedTableError(otherErr))

	// Test with nil
	assert.False(t, IsUndefinedTableError(nil))
}
