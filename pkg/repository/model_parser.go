package repository

import (
	"context"
	"crypto/sha256"
	"fmt"
	"pkg/ctxHelpers"
	"pkg/maps"
	"pkg/str"
	"reflect"
	"slices"
	"strings"
	"sync"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/schema"
	"google.golang.org/protobuf/reflect/protoreflect"
)

type ModelParser interface {
	ParseModel(ctx context.Context, model interface{}) (*Model, error)
}

type modelParserImpl struct {
	bunTables  *schema.Tables
	modelCache *sync.Map
}

func ModelParserProvider(tables *schema.Tables) ModelParser {
	return &modelParserImpl{

		bunTables:  tables,
		modelCache: &sync.Map{},
	}
}

func (this *modelParserImpl) ParseModel(ctx context.Context, model interface{}) (*Model, error) {
	lang := ctxHelpers.GetLanguageFromContext(ctx)
	if model == nil {
		return nil, fmt.Errorf("model must not be nil")
	}

	if m, ok := this.modelCache.Load(reflect.TypeOf(model).String() + "_" + lang); ok {
		return m.(*Model), nil
	}

	models := maps.NewSafeMap[string, *Model]()
	res, err := this.parseModel(ctx, model, nil, models, false)
	if err != nil {
		return nil, err
	}

	this.modelCache.Store(reflect.TypeOf(model).String()+"_"+lang, res)

	return res, nil
}

func (this *modelParserImpl) parseModel(ctx context.Context, model interface{}, typ reflect.Type, models *maps.SafeMap[string, *Model], isJsonB bool) (*Model, error) {
	var modelName string
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	if typ == nil {
		typ = reflect.TypeOf(model)

		if typ.Kind() != reflect.Struct {
			if typ.Kind() == reflect.Ptr {
				typ = typ.Elem()
				if typ.Kind() != reflect.Struct {
					return nil, fmt.Errorf("model must be a struct")
				}
				modelName = reflect.TypeOf(model).Elem().Name() + "_" + lang
			}
		} else {
			modelName = reflect.TypeOf(model).Name() + "_" + lang
		}
	}

	if em, ok := models.Get(typ.String() + "_" + lang); ok {
		return em, nil
	}

	m := NewModel(typ, isJsonB)
	m.Language = lang

	if model != nil {
		method, ok := reflect.TypeOf(model).MethodByName("View")
		if ok {
			if method.Type.NumIn() == 2 && method.Type.In(1) == reflect.TypeOf((*context.Context)(nil)).Elem() && method.Type.NumOut() == 1 && method.Type.Out(0) == reflect.TypeOf((*bun.SelectQuery)(nil)) {
				viewQuery := model.(interface {
					View(ctx context.Context) *bun.SelectQuery
				}).View(ctx)

				if viewQuery == nil {
					return nil, fmt.Errorf("view method must return a non-nil *bun.SelectQuery")
				}
				m.View = &ModelView{
					Schema:    "",
					TableName: "",
					Query:     viewQuery,
					Version:   "",
				}
				m.IsJsonB = false
			} else {
				return nil, fmt.Errorf("view method signature must be func(context.Context) *bun.SelectQuery")
			}
		}

		autocomplete, autocompleteOk := model.(interface {
			Autocomplete(ctx context.Context) Autocomplete
		})
		if autocompleteOk {
			ac := autocomplete.Autocomplete(ctx)
			m.Autocomplete = &ac
		}
	}

	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)

		if field.Type.String() == "repository.AutoLabel" {
			m.AutoLabel = true
			continue
		}

		if field.Type.String() == "schema.BaseModel" {
			n := modelName[0 : len(modelName)-len("_"+lang)]
			m.BunTable = this.bunTables.ByModel(n)

			if m.View != nil {
				_schema, _tableName := splitBunTableName(m.BunTable.Name)
				m.View.Schema = _schema
				m.View.TableName = _tableName
			}

			m.IsJsonB = false

			continue
		}

		bunTag := field.Tag.Get("bun")
		if bunTag == "-" {
			continue
		}

		jsonTag := field.Tag.Get("json")

		tags, err := parseGridViewFieldTags(bunTag, jsonTag)

		if err != nil {
			return nil, err
		}

		if tags.Exclude {
			continue
		}

		f := &ModelField{
			GoName:     field.Name,
			IsEmbedded: tags.Embedded,
			IsArray:    tags.IsArray,
			IsJsonB:    isJsonB,
		}

		if tags.Column != nil {
			f.DbName = *tags.Column
		} else {
			f.DbName = str.ToSnake(field.Name)
		}

		if tags.JsonName != "" {
			f.RpcName = tags.JsonName
		} else {
			f.RpcName = str.ToLowerCamelID(field.Name)
		}

		fieldType := field.Type.String()
		underlyingType := fieldType
		if field.Type.Kind() == reflect.Ptr {
			underlyingType = field.Type.Elem().String()
		}
		f.Type = underlyingType

		if f.IsEmbedded {
			em, err := this.parseModel(ctx, nil, field.Type, models, false)
			if err != nil {
				return nil, err
			}
			for _, ef := range em.GetRpcFields() {
				m.AddField(ef)
			}
			continue
		}
		exceptionTypes := []string{"unix.Timestamp", "decimal.Decimal"}
		// other structs (including pointers to structs) should only be jsonb
		fieldKind := field.Type.Kind()
		actualFieldType := field.Type
		if fieldKind == reflect.Ptr {
			actualFieldType = field.Type.Elem()
			fieldKind = actualFieldType.Kind()
		}
		if fieldKind == reflect.Struct && !slices.Contains(exceptionTypes, actualFieldType.String()) {
			relatedType := actualFieldType
			if relatedType.Kind() == reflect.Slice {
				relatedType = relatedType.Elem()
			}
			if relatedType.Kind() == reflect.Ptr {
				relatedType = relatedType.Elem()
			}
			if relatedType.Kind() != reflect.Struct {
				return nil, fmt.Errorf("jsonb field must be a struct")
			}

			var rm *Model
			var ok bool

			if rm, ok = models.Get(relatedType.String() + "_" + lang); !ok {
				rm, err = this.parseModel(ctx, nil, relatedType, models, true)
				if err != nil {
					return nil, err
				}
			}

			f.IsJsonB = rm.IsJsonB
			f.Model = rm
		}

		var enumDesc protoreflect.EnumDescriptor
		fieldInterface := reflect.New(field.Type).Interface()

		if enum, ok := fieldInterface.(interface {
			Descriptor() protoreflect.EnumDescriptor
		}); ok {
			enumDesc = enum.Descriptor()

			order, ok, err := GetEnumOrder(enumDesc)
			if err != nil {
				return nil, err
			}
			if ok {
				orderBySql := "CASE ?"
				for i, v := range order {
					orderBySql += fmt.Sprintf(" WHEN %d THEN %d", v, i)
				}
				// Do not remove trailing space, needed in query builder
				orderBySql += " END "

				f.OrderBy = &orderBySql
			}
		}

		m.AddField(f)
	}

	if m.View != nil && m.View.Version == "" {
		if m.View.Query != nil {
			// Build the hash input from both the SQL query and the model's field
			// list. Including field names ensures that adding or removing columns
			// in the Go struct (even when the SQL uses "table.*") produces a
			// different hash and therefore a different view name. Without this,
			// PostgreSQL would keep serving a stale view whose "SELECT *" was
			// expanded at CREATE VIEW time with the old column set.
			hashInput := m.View.Query.String()
			for pair := m.RpcFields.Oldest(); pair != nil; pair = pair.Next() {
				hashInput += "\x00" + pair.Value.DbName
			}
			m.View.Version = fmt.Sprintf("%x", sha256.Sum256([]byte(hashInput)))

			// trim version to 12 characters
			if len(m.View.Version) > 12 {
				m.View.Version = m.View.Version[:12]
			}
		}
	}

	models.Set(m.Type.String()+"_"+lang, m)
	return m, nil
}

func parseGridViewFieldTags(bun, json string) (*Tags, error) {
	tags := &Tags{}

	if bun != "" {
		parts := strings.Split(bun, ",")
		for i, part := range parts {
			if i == 0 {
				if len(part) == 0 {
					continue
				}

				tags.Column = &part
				if strings.HasPrefix(part, "-") {
					tags.Exclude = true
				}
				continue
			}
			switch true {
			case strings.HasPrefix(part, "embed"):
				tags.Embedded = true
			case strings.HasPrefix(part, "extend"):
				panic("extend not supported")
			case strings.HasPrefix(part, "rel:"):
				tags.Exclude = true
				//panic("relations not supported")
			case strings.HasPrefix(part, "join:"):
				tags.Exclude = true
				//panic("relations not supported")
			case strings.HasPrefix(part, "join_on:"):
				tags.Exclude = true
				//panic("relations not supported")
			case part == "array":
				tags.IsArray = true
			}
		}
	}

	if json != "" {
		parts := strings.Split(json, ",")
		tags.JsonName = parts[0]
	}

	return tags, nil
}

func splitBunTableName(bunTableName string) (string, string) {
	split := strings.Split(bunTableName, ".")
	if len(split) == 1 {
		return "public", split[0]
	}
	return split[0], split[1]
}
