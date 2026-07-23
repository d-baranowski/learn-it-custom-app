package repository

import (
	"bytes"
	"context"
	"fmt"
	"pkg/ctxHelpers"
	"pkg/maps"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/util"
	"reflect"
	"sort"
	"strings"
	"text/template"
)

type Autocomplete struct {
	Id       *string
	Template string
}

type AutocompleteStoreInterface interface {
	GetForAutocomplete(id string) (interface{}, bool)
}

const AutocompleteTemplateCode = "{{.Code}}"
const AutocompleteTemplateCodeName = "{{- if .Code -}}{{ .Code }} {{ .Name }}{{- else -}}{{ .Name }}{{- end -}}"
const AutocompleteTemplateName = "{{.Name}}"

var autocompleteBuilder *AutocompleteBuilder

type AutocompleteBuilder struct {
	templates *maps.SafeMap[string, *template.Template]
}

func AutocompleteProvider() error {
	s := &AutocompleteBuilder{
		templates: maps.NewSafeMap[string, *template.Template](),
	}

	autocompleteBuilder = s

	return nil
}

func (ab *AutocompleteBuilder) BuildResponse(ctx context.Context, mod *Model, rows []interface{}, orders []*requestv1.OrderBy) (*requestv1.AutocompleteResponse, error) {
	if mod.Autocomplete == nil {
		panic("model has no autocomplete config")
	}

	// Extract language from context headers
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	labelTmpl, ok := ab.templates.Get(mod.Autocomplete.Template)
	if !ok {
		t, err := template.New(mod.Autocomplete.Template).Parse(mod.Autocomplete.Template)
		if err != nil {
			return nil, err
		}
		ab.templates.Set(mod.Autocomplete.Template, t)
		labelTmpl = t
	}

	resp := new(requestv1.AutocompleteResponse)

	if len(rows) == 0 {
		return resp, nil
	}

	resp.Items = make([]*requestv1.AutocompleteItem, 0, len(rows))

	for _, row := range rows {
		// Resolve translations for the current language
		translatedRow := ab.resolveTranslations(row, lang)

		idFieldName := "Id"
		if mod.Autocomplete.Id != nil {
			idFieldName = *mod.Autocomplete.Id
		}

		var id string
		var disabledPtr *bool

		// Check if translatedRow is a map (after translation) or a struct
		if rowMap, ok := translatedRow.(map[string]interface{}); ok {
			// Handle map case
			idVal, ok := rowMap[idFieldName]
			if !ok {
				panic(fmt.Sprintf("invalid autocomplete ID field %s", idFieldName))
			}

			id = ab.formatID(idVal)

			// Check for disabled field
			if disabledVal, ok := rowMap["Disabled"]; ok {
				if disabled, ok := disabledVal.(bool); ok {
					disabledPtr = util.ToPtr(disabled)
				}
			}
		} else {
			// Handle struct case (when there are no TranslatedString fields)
			rowVal := reflect.ValueOf(translatedRow)
			if rowVal.Kind() == reflect.Ptr {
				rowVal = rowVal.Elem()
			}

			idField := rowVal.FieldByName(idFieldName)
			if !idField.IsValid() {
				panic(fmt.Sprintf("invalid autocomplete ID field %s", idFieldName))
			}

			id = ab.formatID(idField.Interface())

			// Check for disabled field
			disabledField := rowVal.FieldByName("Disabled")
			if disabledField.IsValid() {
				disabled := disabledField.Interface().(bool)
				disabledPtr = util.ToPtr(disabled)
			}
		}

		label, err := ab.renderTemplate(labelTmpl, translatedRow)
		if err != nil {
			return nil, err
		}

		item := &requestv1.AutocompleteItem{
			ID:       id,
			Label:    label,
			Disabled: disabledPtr,
			Group:    nil,
		}

		resp.Items = append(resp.Items, item)
	}

	// Apply ordering after labels have been generated
	ab.sortItems(resp.Items, orders)

	return resp, nil
}

func (ab *AutocompleteBuilder) renderTemplate(t *template.Template, data interface{}) (string, error) {
	var rendered bytes.Buffer
	err := t.Execute(&rendered, data)
	if err != nil {
		return "", err
	}
	return rendered.String(), nil
}

// formatID converts an ID value to string
func (ab *AutocompleteBuilder) formatID(idVal interface{}) string {
	switch v := idVal.(type) {
	case string:
		return v
	case int, int8, int16, int32, int64:
		return fmt.Sprintf("%d", v)
	case uint, uint8, uint16, uint32, uint64:
		return fmt.Sprintf("%d", v)
	default:
		val := reflect.ValueOf(idVal)
		switch val.Kind() {
		case reflect.String:
			return val.String()
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			return fmt.Sprintf("%d", val.Int())
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			return fmt.Sprintf("%d", val.Uint())
		default:
			panic(fmt.Sprintf("invalid autocomplete ID field type %T", idVal))
		}
	}
}

// resolveTranslations converts TranslatedString fields to regular strings based on the language
// Returns a map with translated string values
func (ab *AutocompleteBuilder) resolveTranslations(data interface{}, lang string) interface{} {
	val := reflect.ValueOf(data)
	if val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return data
		}
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return data
	}

	// Create a map to hold the translated values
	result := make(map[string]interface{})

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		fieldType := val.Type().Field(i)
		fieldName := fieldType.Name

		// Check if this field is a TranslatedString or *TranslatedString
		if ab.isTranslatedStringType(fieldType.Type) {
			translatedValue := ab.getTranslatedValue(field, lang)
			result[fieldName] = translatedValue
		} else {
			// Copy the field as is
			result[fieldName] = field.Interface()
		}
	}

	return result
}

// sortItems sorts autocomplete items based on the provided order directives
func (ab *AutocompleteBuilder) sortItems(items []*requestv1.AutocompleteItem, orders []*requestv1.OrderBy) {
	if orders == nil || len(orders) == 0 {
		return
	}

	// For now, we only support sorting by "label" field since that's the only
	// field available in AutocompleteItem after generation
	for _, order := range orders {
		if order.Field == "label" {
			if order.Direction == requestv1.OrderDirection_DESC {
				// Sort descending
				sort.Slice(items, func(i, j int) bool {
					return strings.ToLower(items[i].Label) > strings.ToLower(items[j].Label)
				})
			} else {
				// Sort ascending (default)
				sort.Slice(items, func(i, j int) bool {
					return strings.ToLower(items[i].Label) < strings.ToLower(items[j].Label)
				})
			}
			// Only apply the first matching order directive
			break
		}
	}
}

// isTranslatedStringType checks if a type is TranslatedString or *TranslatedString
func (ab *AutocompleteBuilder) isTranslatedStringType(t reflect.Type) bool {
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	return t.Kind() == reflect.Struct && t.Name() == "TranslatedString"
}

// getTranslatedValue extracts the appropriate language string from a TranslatedString field
func (ab *AutocompleteBuilder) getTranslatedValue(field reflect.Value, lang string) string {
	// Handle nil pointer
	if field.Kind() == reflect.Ptr && field.IsNil() {
		return ""
	}

	// Dereference pointer if needed
	val := field
	if field.Kind() == reflect.Ptr {
		val = field.Elem()
	}

	if val.Kind() != reflect.Struct {
		return ""
	}

	// Get the language-specific field (En, Pl, etc.)
	langFieldName := ctxHelpers.LanguageCodeToFieldName(lang)

	langField := val.FieldByName(langFieldName)
	if !langField.IsValid() {
		// Fallback to En if the language field doesn't exist
		langField = val.FieldByName("En")
		if !langField.IsValid() {
			return ""
		}
	}

	langValue := langField.Interface()

	// The field should be *string
	if strPtr, ok := langValue.(*string); ok {
		if strPtr == nil {
			return ""
		}
		return *strPtr
	}

	return ""
}
