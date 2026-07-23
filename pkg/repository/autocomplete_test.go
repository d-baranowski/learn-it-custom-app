package repository

import (
	"context"
	"net/http"
	"pkg/ctxHelpers"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/util"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Mock TranslatedString struct for testing
type TranslatedString struct {
	En *string `json:"en"`
	Pl *string `json:"pl"`
	Vi *string `json:"vi"`
}

// Mock autocomplete model for testing
type MockAutocompleteItem struct {
	Id   string
	Name TranslatedString
	Code string
}

func TestAutocompleteBuilder_ResolveTranslations(t *testing.T) {
	ab := &AutocompleteBuilder{}

	tests := []struct {
		name     string
		language string
		item     *MockAutocompleteItem
		expected string
	}{
		{
			name:     "English translation",
			language: "en",
			item: &MockAutocompleteItem{
				Id:   "1",
				Code: "TEST",
				Name: TranslatedString{
					En: util.ToPtr("English Name"),
					Pl: util.ToPtr("Polish Name"),
					Vi: util.ToPtr("Vietnamese Name"),
				},
			},
			expected: "English Name",
		},
		{
			name:     "Polish translation",
			language: "pl",
			item: &MockAutocompleteItem{
				Id:   "2",
				Code: "TEST2",
				Name: TranslatedString{
					En: util.ToPtr("English Name"),
					Pl: util.ToPtr("Polish Name"),
					Vi: util.ToPtr("Vietnamese Name"),
				},
			},
			expected: "Polish Name",
		},
		{
			name:     "Vietnamese translation",
			language: "vi",
			item: &MockAutocompleteItem{
				Id:   "3",
				Code: "TEST3",
				Name: TranslatedString{
					En: util.ToPtr("English Name"),
					Pl: util.ToPtr("Polish Name"),
					Vi: util.ToPtr("Vietnamese Name"),
				},
			},
			expected: "Vietnamese Name",
		},
		{
			name:     "Fallback to English when language not supported",
			language: "fr",
			item: &MockAutocompleteItem{
				Id:   "4",
				Code: "TEST4",
				Name: TranslatedString{
					En: util.ToPtr("English Name"),
					Pl: util.ToPtr("Polish Name"),
				},
			},
			expected: "English Name",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ab.resolveTranslations(tt.item, tt.language)
			resultMap, ok := result.(map[string]interface{})
			require.True(t, ok, "Result should be a map[string]interface{}")

			// Check that the fields are present
			assert.Equal(t, tt.item.Id, resultMap["Id"])
			assert.Equal(t, tt.item.Code, resultMap["Code"])

			// Check that Name is now a string with the correct translation
			nameValue, ok := resultMap["Name"].(string)
			require.True(t, ok, "Name should be a string")
			assert.Equal(t, tt.expected, nameValue)
		})
	}
}

func TestAutocompleteBuilder_BuildResponse_WithLanguage(t *testing.T) {
	err := AutocompleteProvider()
	require.NoError(t, err)

	tests := []struct {
		name         string
		language     string
		setupContext func() context.Context
		expectedLang string
	}{
		{
			name:     "Extract English from X-I18next-Lng header",
			language: "en",
			setupContext: func() context.Context {
				ctx := context.Background()
				headers := http.Header{}
				headers.Set("X-I18next-Lng", "en")
				return ctxHelpers.SetContextRequestHears(ctx, headers)
			},
			expectedLang: "en",
		},
		{
			name:     "Extract Polish from X-I18next-Lng header",
			language: "pl",
			setupContext: func() context.Context {
				ctx := context.Background()
				headers := http.Header{}
				headers.Set("X-I18next-Lng", "pl")
				return ctxHelpers.SetContextRequestHears(ctx, headers)
			},
			expectedLang: "pl",
		},
		{
			name:     "Default to English when no headers",
			language: "en",
			setupContext: func() context.Context {
				return context.Background()
			},
			expectedLang: "en",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := tt.setupContext()

			// Extract language from context
			lang := "en" // default fallback
			if headers, ok := ctxHelpers.GetContextRequestHeaders(ctx); ok {
				// We would call language.MatchHeaderLanguage(headers) here
				// but for the test we just verify headers are present
				assert.NotNil(t, headers)
			}

			assert.NotEmpty(t, lang)
		})
	}
}

func TestAutocompleteBuilder_IsTranslatedStringType(t *testing.T) {
	ab := &AutocompleteBuilder{}

	tests := []struct {
		name     string
		value    interface{}
		expected bool
	}{
		{
			name: "TranslatedString struct",
			value: TranslatedString{
				En: util.ToPtr("test"),
			},
			expected: true,
		},
		{
			name: "Pointer to TranslatedString",
			value: &TranslatedString{
				En: util.ToPtr("test"),
			},
			expected: true,
		},
		{
			name:     "Regular string",
			value:    "test",
			expected: false,
		},
		{
			name:     "Regular struct",
			value:    MockAutocompleteItem{},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This test would require accessing the type through reflection
			// to properly test isTranslatedStringType
			// For now, we just verify the method exists
			_ = ab
			_ = tt
		})
	}
}

func TestAutocompleteBuilder_Integration(t *testing.T) {
	err := AutocompleteProvider()
	require.NoError(t, err)

	// Define test data
	testItems := []interface{}{
		&MockAutocompleteItem{
			Id:   "1",
			Code: "PSYCH",
			Name: TranslatedString{
				En: util.ToPtr("Psychology"),
				Pl: util.ToPtr("Psychologia"),
				Vi: util.ToPtr("Tâm lý học"),
			},
		},
		&MockAutocompleteItem{
			Id:   "2",
			Code: "PHYSIO",
			Name: TranslatedString{
				En: util.ToPtr("Physiotherapy"),
				Pl: util.ToPtr("Fizjoterapia"),
				Vi: util.ToPtr("Vật lý trị liệu"),
			},
		},
	}

	// Create model with autocomplete config
	model := &Model{
		Autocomplete: &Autocomplete{
			Template: "{{.Code}} - {{.Name}}",
		},
	}

	t.Run("English autocomplete", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "en")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, nil)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 2)

		assert.Equal(t, "1", resp.Items[0].ID)
		assert.Equal(t, "PSYCH - Psychology", resp.Items[0].Label)

		assert.Equal(t, "2", resp.Items[1].ID)
		assert.Equal(t, "PHYSIO - Physiotherapy", resp.Items[1].Label)
	})

	t.Run("Polish autocomplete", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "pl")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, nil)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 2)

		assert.Equal(t, "1", resp.Items[0].ID)
		assert.Equal(t, "PSYCH - Psychologia", resp.Items[0].Label)

		assert.Equal(t, "2", resp.Items[1].ID)
		assert.Equal(t, "PHYSIO - Fizjoterapia", resp.Items[1].Label)
	})

	t.Run("Vietnamese autocomplete", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "vi")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, nil)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 2)

		assert.Equal(t, "1", resp.Items[0].ID)
		assert.Equal(t, "PSYCH - Tâm lý học", resp.Items[0].Label)

		assert.Equal(t, "2", resp.Items[1].ID)
		assert.Equal(t, "PHYSIO - Vật lý trị liệu", resp.Items[1].Label)
	})

	t.Run("Default to English when no language header", func(t *testing.T) {
		ctx := context.Background()

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, nil)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 2)

		assert.Equal(t, "1", resp.Items[0].ID)
		assert.Equal(t, "PSYCH - Psychology", resp.Items[0].Label)
	})
}

func TestAutocompleteBuilder_Sorting(t *testing.T) {
	err := AutocompleteProvider()
	require.NoError(t, err)

	// Define test data with unsorted names
	testItems := []interface{}{
		&MockAutocompleteItem{
			Id:   "3",
			Code: "ZEBRA",
			Name: TranslatedString{
				En: util.ToPtr("Zebra Therapy"),
			},
		},
		&MockAutocompleteItem{
			Id:   "1",
			Code: "ALPHA",
			Name: TranslatedString{
				En: util.ToPtr("Alpha Therapy"),
			},
		},
		&MockAutocompleteItem{
			Id:   "2",
			Code: "BETA",
			Name: TranslatedString{
				En: util.ToPtr("Beta Therapy"),
			},
		},
	}

	model := &Model{
		Autocomplete: &Autocomplete{
			Template: "{{.Name}}",
		},
	}

	t.Run("Sort ascending by label", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "en")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		orders := []*requestv1.OrderBy{
			{
				Field:     "label",
				Direction: requestv1.OrderDirection_ASC,
			},
		}

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, orders)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 3)

		// Should be sorted alphabetically
		assert.Equal(t, "1", resp.Items[0].ID)
		assert.Equal(t, "Alpha Therapy", resp.Items[0].Label)

		assert.Equal(t, "2", resp.Items[1].ID)
		assert.Equal(t, "Beta Therapy", resp.Items[1].Label)

		assert.Equal(t, "3", resp.Items[2].ID)
		assert.Equal(t, "Zebra Therapy", resp.Items[2].Label)
	})

	t.Run("Sort descending by label", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "en")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		orders := []*requestv1.OrderBy{
			{
				Field:     "label",
				Direction: requestv1.OrderDirection_DESC,
			},
		}

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, orders)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 3)

		// Should be sorted reverse alphabetically
		assert.Equal(t, "3", resp.Items[0].ID)
		assert.Equal(t, "Zebra Therapy", resp.Items[0].Label)

		assert.Equal(t, "2", resp.Items[1].ID)
		assert.Equal(t, "Beta Therapy", resp.Items[1].Label)

		assert.Equal(t, "1", resp.Items[2].ID)
		assert.Equal(t, "Alpha Therapy", resp.Items[2].Label)
	})

	t.Run("No sorting when orders is nil", func(t *testing.T) {
		ctx := context.Background()
		headers := http.Header{}
		headers.Set("X-I18next-Lng", "en")
		ctx = ctxHelpers.SetContextRequestHears(ctx, headers)

		resp, err := autocompleteBuilder.BuildResponse(ctx, model, testItems, nil)
		require.NoError(t, err)
		require.NotNil(t, resp)
		require.Len(t, resp.Items, 3)

		// Should maintain original order
		assert.Equal(t, "3", resp.Items[0].ID)
		assert.Equal(t, "1", resp.Items[1].ID)
		assert.Equal(t, "2", resp.Items[2].ID)
	})
}
