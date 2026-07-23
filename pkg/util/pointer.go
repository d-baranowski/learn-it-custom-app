package util

import (
	"time"
)

func ToPtr[T any](v T) *T {
	return &v
}

func FromPtr[T any](v *T) T {
	if v == nil {
		z := new(T)
		return *z
	}
	return *v
}

func PtrBool(b bool) *bool {
	p := b
	return &p
}

func Bool(b *bool) bool {
	if b == nil {
		return false
	}

	return *b
}

func PStr(s string) *string {
	return &s
}

func PTime(t time.Time) *time.Time {
	return &t
}

func PInt(i int) *int {
	return &i
}

func PInt32(i int32) *int32 {
	return &i
}

func PFloat(i float64) *float64 {
	return &i
}

func Str(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}
