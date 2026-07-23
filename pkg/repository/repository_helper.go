package repository

import (
	"reflect"
)

func setFieldIfExists(v reflect.Value, fieldName string, value interface{}) bool {
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	field := v.FieldByName(fieldName)
	if !field.IsValid() || !field.CanSet() {
		return false
	}

	fieldVal := reflect.ValueOf(value)
	if field.Type() == fieldVal.Type() {
		field.Set(fieldVal)
	} else if fieldVal.Kind() == reflect.Ptr && !fieldVal.IsNil() && fieldVal.Elem().Type().AssignableTo(field.Type()) {
		field.Set(fieldVal.Elem())
	} else if field.Kind() == reflect.Ptr {
		if !fieldVal.IsValid() {
			field.Set(reflect.Zero(field.Type()))
		} else {
			newVal := reflect.New(fieldVal.Type())
			newVal.Elem().Set(fieldVal)
			field.Set(newVal)
		}
	} else if field.Type().Kind() == reflect.Ptr && fieldVal.Type().AssignableTo(field.Type().Elem()) {
		newVal := reflect.New(fieldVal.Type())
		newVal.Elem().Set(fieldVal)
		field.Set(newVal)
	}

	return true
}
