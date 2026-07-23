package ctxHelpers

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetLanguageFromContext(t *testing.T) {
	t.Run("Default to English when no headers", func(t *testing.T) {
		ctx := context.Background()
		lang := GetLanguageFromContext(ctx)
		assert.Equal(t, "en", lang, "Should default to English when no headers")
	})

	t.Run("Extract language from X-I18next-Lng header", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "pl")
		ctx = SetContextRequestHears(ctx, headers)

		lang := GetLanguageFromContext(ctx)
		assert.Equal(t, "pl", lang, "Should extract Polish from header")
	})
}

func TestNormalizeLanguageCode(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "English lowercase",
			input:    "en",
			expected: "en",
		},
		{
			name:     "English US",
			input:    "en-US",
			expected: "en",
		},
		{
			name:     "English GB",
			input:    "en-GB",
			expected: "en",
		},
		{
			name:     "Polish lowercase",
			input:    "pl",
			expected: "pl",
		},
		{
			name:     "Polish PL",
			input:    "pl-PL",
			expected: "pl",
		},
		{
			name:     "Vietnamese lowercase",
			input:    "vi",
			expected: "vi",
		},
		{
			name:     "Vietnamese VN",
			input:    "vi-VN",
			expected: "vi",
		},
		{
			name:     "Unsupported language French",
			input:    "fr",
			expected: "en",
		},
		{
			name:     "Unsupported language German",
			input:    "de",
			expected: "en",
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "en",
		},
		{
			name:     "Uppercase EN",
			input:    "EN",
			expected: "en",
		},
		{
			name:     "Uppercase PL",
			input:    "PL",
			expected: "pl",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NormalizeLanguageCode(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLanguageCodeToFieldName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "English to En",
			input:    "en",
			expected: "En",
		},
		{
			name:     "Polish to Pl",
			input:    "pl",
			expected: "Pl",
		},
		{
			name:     "Vietnamese to Vi",
			input:    "vi",
			expected: "Vi",
		},
		{
			name:     "English US to En",
			input:    "en-US",
			expected: "En",
		},
		{
			name:     "Polish PL to Pl",
			input:    "pl-PL",
			expected: "Pl",
		},
		{
			name:     "Vietnamese VN to Vi",
			input:    "vi-VN",
			expected: "Vi",
		},
		{
			name:     "Unsupported language defaults to En",
			input:    "fr",
			expected: "En",
		},
		{
			name:     "Empty string defaults to En",
			input:    "",
			expected: "En",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := LanguageCodeToFieldName(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetContextRequestHeaders(t *testing.T) {
	t.Run("Headers exist in context", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-Test-Header", "test-value")
		ctx = SetContextRequestHears(ctx, headers)

		result, ok := GetContextRequestHeaders(ctx)
		assert.True(t, ok)
		assert.NotNil(t, result)
		assert.Equal(t, "test-value", result.Get("X-Test-Header"))
	})

	t.Run("No headers in context", func(t *testing.T) {
		ctx := context.Background()

		result, ok := GetContextRequestHeaders(ctx)
		assert.False(t, ok)
		assert.Nil(t, result)
	})
}

func TestSetContextRequestHears(t *testing.T) {
	t.Run("Set headers in context", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-Custom-Header", "custom-value")
		headers.Set("X-I18next-Lng", "pl")

		ctx = SetContextRequestHears(ctx, headers)

		result, ok := GetContextRequestHeaders(ctx)
		assert.True(t, ok)
		assert.Equal(t, "custom-value", result.Get("X-Custom-Header"))
		assert.Equal(t, "pl", result.Get("X-I18next-Lng"))
	})

	t.Run("Overwrite existing headers", func(t *testing.T) {
		ctx := context.Background()
		headers1 := http.Header{}
		headers1.Set("X-Test", "value1")
		ctx = SetContextRequestHears(ctx, headers1)

		headers2 := http.Header{}
		headers2.Set("X-Test", "value2")
		ctx = SetContextRequestHears(ctx, headers2)

		result, ok := GetContextRequestHeaders(ctx)
		assert.True(t, ok)
		assert.Equal(t, "value2", result.Get("X-Test"))
	})
}
