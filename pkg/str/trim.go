package str

import "strings"

func TrimToNil(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func TrimPtrToNil(value *string) *string {
	if value == nil {
		return nil
	}
	return TrimToNil(*value)
}
