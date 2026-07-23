package cataloggen

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"path/filepath"
	"reflect"
	"runtime"
	"slices"
	"sort"
	"strconv"
	"strings"
)

type astNotificationEventDefinition struct {
	Key         string
	DisplayName string
	Description string
	PayloadType ast.Expr
}

const (
	GeneratedNotificationPayloadFieldTypeUnspecified = 0
	GeneratedNotificationPayloadFieldTypeString      = 1
	GeneratedNotificationPayloadFieldTypeNumber      = 2
	GeneratedNotificationPayloadFieldTypeBoolean     = 3
	GeneratedNotificationPayloadFieldTypeDate        = 4
	GeneratedNotificationPayloadFieldTypeDateTime    = 5
	GeneratedNotificationPayloadFieldTypeJSON        = 6
	GeneratedNotificationPayloadFieldTypeArray       = 7
)

type GeneratedEventPayloadField struct {
	Path        string  `json:"path"`
	Type        int     `json:"type"`
	Required    bool    `json:"required"`
	Description *string `json:"description,omitempty"`
}

type GeneratedEventTypeSpec struct {
	Key           string                       `json:"key"`
	Version       int                          `json:"version"`
	DisplayName   string                       `json:"displayName"`
	Description   *string                      `json:"description,omitempty"`
	PayloadFields []GeneratedEventPayloadField `json:"payloadFields"`
}

type persistedGeneratedEventTypeSpec struct {
	Version       int                          `json:"version"`
	DisplayName   string                       `json:"displayName"`
	Description   *string                      `json:"description,omitempty"`
	PayloadFields []GeneratedEventPayloadField `json:"payloadFields"`
}

func GeneratedNotificationEventTypeSpecs(existing []GeneratedEventTypeSpec) ([]GeneratedEventTypeSpec, error) {
	return GeneratedNotificationEventTypeSpecsFromSource(existing, "")
}

func GeneratedNotificationEventTypeSpecsFromSource(existing []GeneratedEventTypeSpec, sourceDir string) ([]GeneratedEventTypeSpec, error) {
	result := make([]GeneratedEventTypeSpec, len(existing))
	copy(result, existing)

	definitions, structTypes, err := loadNotificationEventDefinitionsFromSource(sourceDir)
	if err != nil {
		return nil, err
	}

	for _, definition := range definitions {
		spec, err := buildGeneratorOwnedEventTypeSpec(definition, structTypes)
		if err != nil {
			return nil, err
		}

		latestIndex, latest, found := latestEventTypeSpecForKey(result, spec.Key)
		if !found {
			spec.Version = 1
			result = append(result, spec)
			continue
		}

		spec.Version = latest.Version
		if eventTypeSchemaBreakingChange(latest.PayloadFields, spec.PayloadFields) {
			spec.Version = latest.Version + 1
			result = append(result, spec)
			continue
		}

		result[latestIndex] = spec
	}

	sort.Slice(result, func(i, j int) bool {
		leftKey := strings.TrimSpace(result[i].Key)
		rightKey := strings.TrimSpace(result[j].Key)
		if leftKey == rightKey {
			return result[i].Version < result[j].Version
		}
		return leftKey < rightKey
	})

	return result, nil
}

func loadNotificationEventDefinitionsFromSource(sourceDir string) ([]astNotificationEventDefinition, map[string]*ast.StructType, error) {
	packageDir, err := notificationEventsPackageDir(sourceDir)
	if err != nil {
		return nil, nil, err
	}

	fset := token.NewFileSet()
	files, err := parseFlatGoPackageFiles(fset, packageDir)
	if err != nil {
		return nil, nil, err
	}

	stringConsts := make(map[string]string)
	structTypes := make(map[string]*ast.StructType)

	for _, file := range files {
		for _, decl := range file.Decls {
			genDecl, ok := decl.(*ast.GenDecl)
			if !ok {
				continue
			}

			switch genDecl.Tok {
			case token.CONST:
				for _, spec := range genDecl.Specs {
					valueSpec, ok := spec.(*ast.ValueSpec)
					if !ok {
						continue
					}
					for index, name := range valueSpec.Names {
						if len(valueSpec.Values) <= index {
							continue
						}
						value, ok := stringValueFromExpr(valueSpec.Values[index], stringConsts)
						if ok {
							stringConsts[name.Name] = value
						}
					}
				}
			case token.TYPE:
				for _, spec := range genDecl.Specs {
					typeSpec, ok := spec.(*ast.TypeSpec)
					if !ok {
						continue
					}
					structType, ok := typeSpec.Type.(*ast.StructType)
					if ok {
						structTypes[typeSpec.Name.Name] = structType
					}
				}
			}
		}
	}

	var definitions []astNotificationEventDefinition
	for _, file := range files {
		for _, decl := range file.Decls {
			genDecl, ok := decl.(*ast.GenDecl)
			if !ok || genDecl.Tok != token.VAR {
				continue
			}
			for _, spec := range genDecl.Specs {
				valueSpec, ok := spec.(*ast.ValueSpec)
				if !ok {
					continue
				}
				for _, value := range valueSpec.Values {
					definition, ok, err := parseEventDefinitionValue(value, stringConsts)
					if err != nil {
						return nil, nil, err
					}
					if ok {
						definitions = append(definitions, definition)
					}
				}
			}
		}
	}

	sort.Slice(definitions, func(i, j int) bool {
		return definitions[i].Key < definitions[j].Key
	})

	return definitions, structTypes, nil
}

// parseFlatGoPackageFiles parses non-test *.go files in packageDir (not subdirectories),
// matching go/parser.ParseDir per-file behavior without using deprecated ast.Package.
func parseFlatGoPackageFiles(fset *token.FileSet, packageDir string) ([]*ast.File, error) {
	paths, err := filepath.Glob(filepath.Join(packageDir, "*.go"))
	if err != nil {
		return nil, err
	}
	sort.Strings(paths)

	var files []*ast.File
	var pkgName string

	for _, path := range paths {
		if strings.HasSuffix(path, "_test.go") {
			continue
		}
		file, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			return nil, err
		}

		name := file.Name.Name
		switch {
		case pkgName == "":
			pkgName = name
		case pkgName != name:
			return nil, fmt.Errorf("multiple Go packages in %s: %s and %s", packageDir, pkgName, name)
		}
		files = append(files, file)
	}

	if len(files) == 0 {
		return nil, fmt.Errorf("no Go package found in %s", packageDir)
	}

	return files, nil
}

func notificationEventsPackageDir(sourceDir string) (string, error) {
	if strings.TrimSpace(sourceDir) != "" {
		return filepath.Clean(sourceDir), nil
	}

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("resolve notification event generator caller")
	}
	return filepath.Join(filepath.Dir(filename), "..", "notification_events"), nil
}

func parseEventDefinitionValue(value ast.Expr, stringConsts map[string]string) (astNotificationEventDefinition, bool, error) {
	composite, ok := value.(*ast.CompositeLit)
	if !ok || !isIdentNamed(composite.Type, "EventDefinition") {
		return astNotificationEventDefinition{}, false, nil
	}

	definition := astNotificationEventDefinition{}
	for _, elt := range composite.Elts {
		keyValue, ok := elt.(*ast.KeyValueExpr)
		if !ok {
			continue
		}
		keyIdent, ok := keyValue.Key.(*ast.Ident)
		if !ok {
			continue
		}

		switch keyIdent.Name {
		case "Key":
			value, ok := stringValueFromExpr(keyValue.Value, stringConsts)
			if !ok {
				return astNotificationEventDefinition{}, false, fmt.Errorf("event definition key must be a string literal or const")
			}
			definition.Key = value
		case "DisplayName":
			value, ok := stringValueFromExpr(keyValue.Value, stringConsts)
			if !ok {
				return astNotificationEventDefinition{}, false, fmt.Errorf("event definition displayName must be a string literal or const")
			}
			definition.DisplayName = value
		case "Description":
			value, ok := stringValueFromExpr(keyValue.Value, stringConsts)
			if !ok {
				return astNotificationEventDefinition{}, false, fmt.Errorf("event definition description must be a string literal or const")
			}
			definition.Description = value
		case "Payload":
			payloadType, err := payloadExprType(keyValue.Value)
			if err != nil {
				return astNotificationEventDefinition{}, false, err
			}
			definition.PayloadType = payloadType
		}
	}

	if strings.TrimSpace(definition.Key) == "" {
		return astNotificationEventDefinition{}, false, fmt.Errorf("event definition key is required")
	}
	if strings.TrimSpace(definition.DisplayName) == "" {
		return astNotificationEventDefinition{}, false, fmt.Errorf("event definition displayName is required for key %q", definition.Key)
	}
	if definition.PayloadType == nil {
		return astNotificationEventDefinition{}, false, fmt.Errorf("event definition payload is required for key %q", definition.Key)
	}

	return definition, true, nil
}

func stringValueFromExpr(expr ast.Expr, stringConsts map[string]string) (string, bool) {
	switch typed := expr.(type) {
	case *ast.BasicLit:
		if typed.Kind != token.STRING {
			return "", false
		}
		value, err := strconv.Unquote(typed.Value)
		if err != nil {
			return "", false
		}
		return value, true
	case *ast.Ident:
		value, ok := stringConsts[typed.Name]
		return value, ok
	default:
		return "", false
	}
}

func payloadExprType(expr ast.Expr) (ast.Expr, error) {
	switch typed := expr.(type) {
	case *ast.CompositeLit:
		return typed.Type, nil
	case *ast.UnaryExpr:
		if typed.Op == token.AND {
			return payloadExprType(typed.X)
		}
	}
	return nil, fmt.Errorf("event definition payload must be a composite literal")
}

func buildGeneratorOwnedEventTypeSpec(definition astNotificationEventDefinition, structTypes map[string]*ast.StructType) (GeneratedEventTypeSpec, error) {
	fields, err := payloadFieldsFromASTType(structTypes, definition.PayloadType, "", false)
	if err != nil {
		return GeneratedEventTypeSpec{}, fmt.Errorf("derive payload fields for %q: %w", definition.Key, err)
	}

	spec := GeneratedEventTypeSpec{
		Key:           strings.TrimSpace(definition.Key),
		DisplayName:   strings.TrimSpace(definition.DisplayName),
		PayloadFields: fields,
	}
	if spec.Key == "" {
		return GeneratedEventTypeSpec{}, fmt.Errorf("event type key is required")
	}
	if spec.DisplayName == "" {
		return GeneratedEventTypeSpec{}, fmt.Errorf("event type %q displayName is required", spec.Key)
	}

	description := strings.TrimSpace(definition.Description)
	if description != "" {
		spec.Description = &description
	}
	return spec, nil
}

func payloadFieldsFromASTType(structTypes map[string]*ast.StructType, expr ast.Expr, prefix string, parentOptional bool) ([]GeneratedEventPayloadField, error) {
	switch typed := expr.(type) {
	case *ast.StarExpr:
		return payloadFieldsFromASTType(structTypes, typed.X, prefix, true)
	case *ast.Ident:
		if basicType, ok, err := astNotificationPayloadFieldType(typed.Name, ""); ok {
			if err != nil {
				return nil, err
			}
			if prefix == "" {
				return nil, fmt.Errorf("basic payload field type %q cannot be used as root payload", typed.Name)
			}
			return []GeneratedEventPayloadField{{
				Path:     prefix,
				Type:     basicType,
				Required: !parentOptional,
			}}, nil
		}
		structType, ok := structTypes[typed.Name]
		if !ok {
			return nil, fmt.Errorf("struct type %q was not found in the event definition source package", typed.Name)
		}
		return payloadFieldsFromASTStruct(structTypes, structType, prefix, parentOptional)
	case *ast.StructType:
		return payloadFieldsFromASTStruct(structTypes, typed, prefix, parentOptional)
	case *ast.ArrayType, *ast.MapType, *ast.InterfaceType:
		if prefix == "" {
			return nil, fmt.Errorf("json payload field requires a named path")
		}
		return []GeneratedEventPayloadField{{
			Path:     prefix,
			Type:     GeneratedNotificationPayloadFieldTypeJSON,
			Required: !parentOptional,
		}}, nil
	default:
		return nil, fmt.Errorf("unsupported payload expression type %T", expr)
	}
}

func payloadFieldsFromASTStruct(structTypes map[string]*ast.StructType, structType *ast.StructType, prefix string, parentOptional bool) ([]GeneratedEventPayloadField, error) {
	var fields []GeneratedEventPayloadField

	for _, field := range structType.Fields.List {
		if len(field.Names) == 0 {
			return nil, fmt.Errorf("embedded fields are not supported in notification payload definitions")
		}
		fieldName, ok := jsonFieldNameFromTag(field.Tag)
		if !ok {
			continue
		}

		fieldPrefix := fieldName
		if prefix != "" {
			fieldPrefix = prefix + "." + fieldName
		}

		fieldOptional := parentOptional
		fieldExpr := field.Type
		for {
			star, ok := fieldExpr.(*ast.StarExpr)
			if !ok {
				break
			}
			fieldOptional = true
			fieldExpr = star.X
		}

		if basicType, ok, err := astPayloadTypeFromExpr(fieldExpr, field); ok {
			if err != nil {
				return nil, err
			}
			fields = append(fields, GeneratedEventPayloadField{
				Path:     fieldPrefix,
				Type:     basicType,
				Required: !fieldOptional,
			})
			continue
		}

		nested, err := payloadFieldsFromASTType(structTypes, fieldExpr, fieldPrefix, fieldOptional)
		if err != nil {
			return nil, err
		}
		fields = append(fields, nested...)
	}

	sort.Slice(fields, func(i, j int) bool {
		return fields[i].Path < fields[j].Path
	})
	return fields, nil
}

func astPayloadTypeFromExpr(expr ast.Expr, field *ast.Field) (int, bool, error) {
	notificationTag := notificationTagValue(field.Tag)

	switch expr.(type) {
	case *ast.ArrayType:
		if notificationTag != "" && notificationTag != "json" {
			return 0, false, fmt.Errorf("notification tag %q is not valid for ARRAY payload field", notificationTag)
		}
		return GeneratedNotificationPayloadFieldTypeArray, true, nil
	case *ast.MapType, *ast.InterfaceType:
		if notificationTag != "" && notificationTag != "json" {
			return 0, false, fmt.Errorf("notification tag %q is not valid for JSON payload field", notificationTag)
		}
		return GeneratedNotificationPayloadFieldTypeJSON, true, nil
	}

	ident, ok := expr.(*ast.Ident)
	if !ok {
		return 0, false, nil
	}
	return astNotificationPayloadFieldType(ident.Name, notificationTag)
}

func astNotificationPayloadFieldType(typeName string, notificationTag string) (int, bool, error) {
	switch strings.TrimSpace(notificationTag) {
	case "":
	case "date":
		return GeneratedNotificationPayloadFieldTypeDate, true, nil
	case "datetime":
		return GeneratedNotificationPayloadFieldTypeDateTime, true, nil
	case "json":
		return GeneratedNotificationPayloadFieldTypeJSON, true, nil
	default:
		return 0, false, fmt.Errorf("unsupported notification tag %q", notificationTag)
	}

	switch typeName {
	case "string":
		return GeneratedNotificationPayloadFieldTypeString, true, nil
	case "int", "int8", "int16", "int32", "int64",
		"uint", "uint8", "uint16", "uint32", "uint64",
		"float32", "float64":
		return GeneratedNotificationPayloadFieldTypeNumber, true, nil
	case "bool":
		return GeneratedNotificationPayloadFieldTypeBoolean, true, nil
	case "any":
		return GeneratedNotificationPayloadFieldTypeJSON, true, nil
	default:
		return 0, false, nil
	}
}

func jsonFieldNameFromTag(tag *ast.BasicLit) (string, bool) {
	if tag == nil {
		return "", false
	}
	rawTag, err := strconv.Unquote(tag.Value)
	if err != nil {
		return "", false
	}

	value := reflect.StructTag(rawTag).Get("json")
	if value == "" {
		return "", false
	}
	name, _, _ := strings.Cut(value, ",")
	name = strings.TrimSpace(name)
	if name == "" || name == "-" {
		return "", false
	}
	return name, true
}

func notificationTagValue(tag *ast.BasicLit) string {
	if tag == nil {
		return ""
	}
	rawTag, err := strconv.Unquote(tag.Value)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(reflect.StructTag(rawTag).Get("notification"))
}

func isIdentNamed(expr ast.Expr, expected string) bool {
	ident, ok := expr.(*ast.Ident)
	return ok && ident.Name == expected
}

func latestEventTypeSpecForKey(specs []GeneratedEventTypeSpec, key string) (int, GeneratedEventTypeSpec, bool) {
	trimmedKey := strings.TrimSpace(key)
	bestIndex := -1
	best := GeneratedEventTypeSpec{}
	for index, spec := range specs {
		if strings.TrimSpace(spec.Key) != trimmedKey {
			continue
		}
		if bestIndex == -1 || spec.Version > best.Version {
			bestIndex = index
			best = spec
		}
	}
	return bestIndex, best, bestIndex >= 0
}

func eventTypeSchemaBreakingChange(previous []GeneratedEventPayloadField, current []GeneratedEventPayloadField) bool {
	currentPaths := make(map[string]struct{}, len(current))
	for _, field := range current {
		currentPaths[strings.TrimSpace(field.Path)] = struct{}{}
	}

	for _, field := range previous {
		if _, ok := currentPaths[strings.TrimSpace(field.Path)]; !ok {
			return true
		}
	}

	return false
}

func MarshalNotificationEventTypeSpecs(specs []GeneratedEventTypeSpec) ([]byte, error) {
	normalized := make([]GeneratedEventTypeSpec, len(specs))
	copy(normalized, specs)

	sort.Slice(normalized, func(i, j int) bool {
		leftKey := strings.TrimSpace(normalized[i].Key)
		rightKey := strings.TrimSpace(normalized[j].Key)
		if leftKey == rightKey {
			return normalized[i].Version < normalized[j].Version
		}
		return leftKey < rightKey
	})

	for index := range normalized {
		sort.Slice(normalized[index].PayloadFields, func(i, j int) bool {
			return normalized[index].PayloadFields[i].Path < normalized[index].PayloadFields[j].Path
		})
	}

	grouped := make(map[string][]persistedGeneratedEventTypeSpec)
	for _, spec := range normalized {
		key := strings.TrimSpace(spec.Key)
		grouped[key] = append(grouped[key], persistedGeneratedEventTypeSpec{
			Version:       spec.Version,
			DisplayName:   spec.DisplayName,
			Description:   spec.Description,
			PayloadFields: spec.PayloadFields,
		})
	}

	return json.MarshalIndent(grouped, "", "  ")
}

func ParseNotificationEventTypeSpecs(raw []byte) ([]GeneratedEventTypeSpec, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	var grouped map[string][]persistedGeneratedEventTypeSpec
	if err := json.Unmarshal(raw, &grouped); err != nil {
		return nil, err
	}

	var specs []GeneratedEventTypeSpec
	for key, entries := range grouped {
		for _, entry := range entries {
			specs = append(specs, GeneratedEventTypeSpec{
				Key:           key,
				Version:       entry.Version,
				DisplayName:   entry.DisplayName,
				Description:   entry.Description,
				PayloadFields: entry.PayloadFields,
			})
		}
	}

	for index := range specs {
		specs[index].Key = strings.TrimSpace(specs[index].Key)
		specs[index].DisplayName = strings.TrimSpace(specs[index].DisplayName)
		if specs[index].Description != nil {
			description := strings.TrimSpace(*specs[index].Description)
			specs[index].Description = &description
		}
		specs[index].PayloadFields = slices.Clone(specs[index].PayloadFields)
		for fieldIndex := range specs[index].PayloadFields {
			specs[index].PayloadFields[fieldIndex].Path = strings.TrimSpace(specs[index].PayloadFields[fieldIndex].Path)
		}
	}
	return specs, nil
}
