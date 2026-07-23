package api

import (
	"fmt"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	apiv1 "pkg/api/gen/api/v1"
	"pkg/str"
	"reflect"
	"strings"
)

func isExcludedFromUpdate(message proto.Message, fieldName string) (bool, error) {
	msgReflect := message.ProtoReflect()

	msgDescriptor := msgReflect.Descriptor()

	fieldDescriptor := msgDescriptor.Fields().ByName(protoreflect.Name(fieldName))
	if fieldDescriptor == nil {
		return true, nil
		// todo: removed to allow save messages without having to specify every field
		//return false, fmt.Errorf("field %s not found", fieldName)
	}

	options := fieldDescriptor.Options()
	if options == nil {
		return false, nil
	}

	option := proto.GetExtension(options, apiv1.E_TsUpdateDisabled).(bool) // Replace `v1.E_MyOption` with the actual extension
	return option, nil
}

func isFieldSet(s interface{}, fieldName string) (bool, error) {
	v := reflect.ValueOf(s)

	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	if v.Kind() != reflect.Struct {
		return false, fmt.Errorf("expected a struct, got %T", s)
	}

	field := v.FieldByName(fieldName)
	if !field.IsValid() {
		return false, fmt.Errorf("field %s not found in struct", fieldName)
	}

	zeroValue := reflect.Zero(field.Type()).Interface()
	currentValue := field.Interface()

	return !reflect.DeepEqual(currentValue, zeroValue), nil
}

func protoMessageFieldMap[M any](row *M, message proto.Message) map[string]struct{} {
	msgReflect := message.ProtoReflect()
	msgDescriptor := msgReflect.Descriptor()

	fieldMap := make(map[string]struct{})
	for i := 0; i < msgDescriptor.Fields().Len(); i++ {
		field := msgDescriptor.Fields().Get(i)
		fieldMap[string(field.Name())] = struct{}{}
	}

	v := reflect.ValueOf(row).Elem()
	for i := 0; i < v.NumField(); i++ {
		f := v.Type().Field(i)
		if f.Tag.Get("bun") == "-" {
			jsonName := extractJSONFieldName(f)
			delete(fieldMap, jsonName)
		}
	}

	return fieldMap
}

// ExtractJSONFieldName extracts the JSON field name from the struct tag.
func extractJSONFieldName(field reflect.StructField) string {
	jsonTag := field.Tag.Get("json")
	if jsonTag == "" {
		return str.ToLowerCamel(field.Name) // No json tag
	}

	// Split by comma to separate rate the name and options
	parts := strings.Split(jsonTag, ",")

	// The first part is the name if it exists
	if parts[0] == "" {
		return field.Name // If no name is specified, use the struct field name
	}

	return parts[0] // Return the extracted name
}
