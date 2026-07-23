package repository

import (
	"context"
	"fmt"
	"pkg/ctxHelpers"
	"reflect"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/schema"
	om "github.com/wk8/go-ordered-map/v2"
)

type ModelView struct {
	Schema    string
	TableName string
	Query     *bun.SelectQuery
	Version   string
}

func (v *ModelView) TableExpr(ctx context.Context) string {
	lang := ctxHelpers.GetLanguageFromContext(ctx)
	if v.Version != "" {
		return fmt.Sprintf("%s.%s_%s_%s", v.Schema, v.TableName, v.Version, lang)
	}
	return v.TableName
}

func (v *ModelView) VersionedName(ctx context.Context) string {
	lang := ctxHelpers.GetLanguageFromContext(ctx)
	if v.Version != "" {
		return fmt.Sprintf("%s_%s_%s", v.TableName, v.Version, lang)
	}
	return v.TableName
}

type Model struct {
	Autocomplete          *Autocomplete
	AutoLabel             bool
	BunTable              *schema.Table
	GoFields              *om.OrderedMap[string, *ModelField]
	RpcFields             *om.OrderedMap[string, *ModelField]
	IsJsonB               bool
	Type                  reflect.Type
	View                  *ModelView
	ViewColumnExpressions []string
	JoinExpressions       []string
	Language              string
}

func NewModel(typ reflect.Type, isJsonB bool) *Model {
	return &Model{
		GoFields:              om.New[string, *ModelField](),
		RpcFields:             om.New[string, *ModelField](),
		Type:                  typ,
		IsJsonB:               isJsonB,
		ViewColumnExpressions: make([]string, 0),
		JoinExpressions:       make([]string, 0),
	}
}

func (v *Model) TypeInterface() interface{} {
	i := reflect.New(v.Type).Interface()
	return i
}

func (v *Model) AddField(field *ModelField) {
	if field.Type == "schema.BaseModel" {
		return
	}

	if field.RpcName == "" {
		field.RpcName = field.DbName
	}

	v.GoFields.Set(field.GoName, field)
	v.RpcFields.Set(field.RpcName, field)
}

func (v *Model) GetGoField(name string) (*ModelField, bool) {
	field, ok := v.GoFields.Get(name)
	return field, ok
}

func (v *Model) GetRpcField(name string) (*ModelField, bool) {
	field, ok := v.RpcFields.Get(name)
	return field, ok
}

func (v *Model) GetGoFields() []*ModelField {
	fields := make([]*ModelField, 0, v.GoFields.Len())
	for pair := v.GoFields.Oldest(); pair != nil; pair = pair.Next() {
		fields = append(fields, pair.Value)
	}
	return fields
}

func (v *Model) GetRpcFields() []*ModelField {
	fields := make([]*ModelField, 0, v.RpcFields.Len())
	for pair := v.RpcFields.Oldest(); pair != nil; pair = pair.Next() {
		fields = append(fields, pair.Value)
	}
	return fields
}

func (v *Model) TableName(ctx context.Context) string {
	if v.View != nil {
		// model may have a view but not be initialised or using it
		// for example in the autocomplete method or tests
		if v.View.TableName != "" && v.View.Version != "" {
			return fmt.Sprintf("%s_%s_%s", v.BunTable.Name, v.View.Version, ctxHelpers.GetLanguageFromContext(ctx))
		}
	}
	return v.BunTable.Name
}

type ModelField struct {
	DbName     string
	GoName     string
	RpcName    string
	Type       string
	IsEmbedded bool
	IsJsonB    bool
	IsArray    bool
	Model      *Model
	OrderBy    *string
}

func (f *ModelField) ColumnSQL(table *string) string {
	if table == nil {
		return f.DbName
	}
	return fmt.Sprintf("%s.%s", *table, f.DbName)
}

type Tags struct {
	Column   *string
	Embedded bool
	Exclude  bool
	IsArray  bool
	JsonName string
}
