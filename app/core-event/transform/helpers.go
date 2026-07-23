package transform

import (
	"fmt"
	"time"
)

func asString(v any) string {
	if v == nil {
		return ""
	}
	switch s := v.(type) {
	case string:
		return s
	default:
		return fmt.Sprintf("%v", v)
	}
}

func asStringPtr(v any) *string {
	if v == nil {
		return nil
	}
	s := asString(v)
	return &s
}

func asInt64Ptr(v any) *int64 {
	if v == nil {
		return nil
	}
	switch n := v.(type) {
	case int64:
		return &n
	case int:
		i := int64(n)
		return &i
	case time.Time:
		ms := n.UnixMilli()
		return &ms
	default:
		return nil
	}
}

func isNonNil(v any) bool {
	return v != nil
}

func transitionedToNonNil(oldVal, newVal any) bool {
	return oldVal == nil && newVal != nil
}
