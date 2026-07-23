s# Language Helper Functions

## Overview
Centralized language extraction and normalization functions to reduce code duplication across the codebase.

## Functions

### `GetLanguageFromContext(ctx context.Context) string`
Extracts the language from request context headers and returns a normalized language code.

**Returns:**
- `"en"` - English (default)
- `"pl"` - Polish
- `"vi"` - Vietnamese

**Example:**
```go
lang := ctxHelpers.GetLanguageFromContext(ctx)
// lang = "en", "pl", or "vi"
```

### `NormalizeLanguageCode(lang string) string`
Converts various language code formats to their base normalized form.

**Input → Output:**
- `"en"`, `"en-US"`, `"en-GB"` → `"en"`
- `"pl"`, `"pl-PL"` → `"pl"`
- `"vi"`, `"vi-VN"` → `"vi"`
- Any other → `"en"` (fallback)

**Example:**
```go
normalized := ctxHelpers.NormalizeLanguageCode("en-US")
// normalized = "en"
```

### `LanguageCodeToFieldName(lang string) string`
Converts a language code to the corresponding TranslatedString field name (capitalized).

**Input → Output:**
- `"en"` → `"En"`
- `"pl"` → `"Pl"`
- `"vi"` → `"Vi"`
- Any other → `"En"` (fallback)

**Example:**
```go
fieldName := ctxHelpers.LanguageCodeToFieldName("pl")
// fieldName = "Pl"
// Can be used with: translatedString.FieldByName(fieldName)
```

## Usage Examples

### In Model View Methods
```go
func (*TherapistService) View(ctx context.Context) *bun.SelectQuery {
    lang := ctxHelpers.GetLanguageFromContext(ctx)
    
    return repository.NoopDB.NewSelect().
        TableExpr("core.therapist_service AS therapist_service").
        ColumnExpr("therapist_service.*").
        ColumnExpr(fmt.Sprintf("therapist.professional_title->>'%s' AS therapist_label", lang)).
        ColumnExpr(fmt.Sprintf("service.name->>'%s' AS service_label", lang)).
        Join("LEFT JOIN core.therapist AS therapist ON therapist_service.therapist_id = therapist.id").
        Join("LEFT JOIN core.service AS service ON therapist_service.service_id = service.id")
}
```

### In Autocomplete Builder
```go
func (ab *AutocompleteBuilder) BuildResponse(ctx context.Context, mod *Model, rows []interface{}) (*requestv1.AutocompleteResponse, error) {
    lang := ctxHelpers.GetLanguageFromContext(ctx)
    
    // Use lang for translation resolution
    translatedRow := ab.resolveTranslations(row, lang)
    // ...
}
```

### With Reflection (TranslatedString Fields)
```go
func (ab *AutocompleteBuilder) getTranslatedValue(field reflect.Value, lang string) string {
    // Get the field name (En, Pl, Vi)
    langFieldName := ctxHelpers.LanguageCodeToFieldName(lang)
    
    // Access the field via reflection
    langField := val.FieldByName(langFieldName)
    // ...
}
```

## Benefits

1. **Single Source of Truth**: Language normalization logic is in one place
2. **Consistency**: All parts of the application use the same language codes
3. **Maintainability**: Easy to add new languages or modify normalization rules
4. **Testability**: Helper functions can be easily unit tested
5. **Readability**: Code is cleaner and more expressive

## Before vs After

### Before (Duplicated Logic)
```go
// In multiple files:
lang := "en"
if headers, ok := ctxHelpers.GetContextRequestHeaders(ctx); ok {
    matchedLang := language.MatchHeaderLanguage(headers)
    if matchedLang != "" {
        lang = matchedLang
    }
}

langField := "en"
switch strings.ToLower(lang) {
case "en", "en-us", "en-gb":
    langField = "en"
case "pl", "pl-pl":
    langField = "pl"
case "vi", "vi-vn":
    langField = "vi"
default:
    langField = "en"
}
```

### After (Reusable Helper)
```go
// In all files:
lang := ctxHelpers.GetLanguageFromContext(ctx)
```

## Testing

Comprehensive tests are available in `request_headers_test.go` covering:
- Language extraction from various header formats
- Language code normalization for all supported languages
- Field name conversion for TranslatedString access
- Context header storage and retrieval
- Edge cases (empty strings, unsupported languages, missing headers)

Run tests with:
```bash
cd pkg/ctxHelpers
go test -v
```

