# Autocomplete Translation Feature

## Overview
The autocomplete functionality now supports language-aware rendering of `TranslatedString` fields. When a model uses `TranslatedString` fields, the autocomplete will automatically render them in the appropriate language based on the request headers.

## How It Works

### 1. Language Detection
The system extracts the language from the request context using the following priority:
1. `X-I18next-Lng` header
2. `Accept-Language` header
3. Defaults to `"en"` (English) if no language is specified

### 2. Translation Resolution
When building the autocomplete response:
1. Each row is processed through `resolveTranslations()`
2. Fields of type `TranslatedString` or `*TranslatedString` are detected using reflection
3. The appropriate language-specific field (`En`, `Pl`, `Vi`) is extracted
4. A map representation is created with translated strings replacing `TranslatedString` fields

### 3. Template Rendering
The template is rendered using the translated data, allowing templates to access translated fields as regular strings:
```go
// Template: "{{.Code}} - {{.Name}}"
// Where Name is a TranslatedString, it will be rendered as:
// "PSYCH - Psychology" (en)
// "PSYCH - Psychologia" (pl)
// "PSYCH - Tâm lý học" (vi)
```

## Supported Languages
- English: `en`, `en-us`, `en-gb` → maps to `TranslatedString.En`
- Polish: `pl`, `pl-pl` → maps to `TranslatedString.Pl`
- Vietnamese: `vi`, `vi-vn` → maps to `TranslatedString.Vi`

## Example Usage

### Model Definition
```go
type Specialization struct {
    Id          string           `bun:"id,pk"`
    Code        string           `bun:"code"`
    Name        TranslatedString `bun:"name"`
    Description *TranslatedString `bun:"description"`
}
```

### Request Flow
1. Client sends request with `X-I18next-Lng: pl` header
2. HeaderInterceptor captures headers and stores in context
3. Autocomplete request is made
4. AutocompleteBuilder extracts language from context
5. For each row, `TranslatedString` fields are resolved to Polish strings
6. Template is rendered with Polish translations
7. Response contains Polish labels

### API Call Example
```
GET /api/specializations/autocomplete?search=psych
Headers:
  X-I18next-Lng: pl

Response:
{
  "items": [
    {
      "id": "1",
      "label": "PSYCH - Psychologia"
    }
  ]
}
```

## Implementation Details

### Key Methods

#### `resolveTranslations(data interface{}, lang string) interface{}`
Converts a struct with `TranslatedString` fields into a map with translated string values.

#### `isTranslatedStringType(t reflect.Type) bool`
Checks if a field type is `TranslatedString` or `*TranslatedString`.

#### `getTranslatedValue(field reflect.Value, lang string) string`
Extracts the appropriate language string from a `TranslatedString` field with fallback to English.

#### `formatID(idVal interface{}) string`
Converts various ID types (string, int, uint) to string format.

### Context Flow
```
Request → HeaderInterceptor → ctxHelpers.SetContextRequestHears() →
Context with Headers → AutocompleteBuilder.BuildResponse() →
language.MatchHeaderLanguage() → resolveTranslations() →
Template Rendering → Response
```

## Testing
Comprehensive tests are included in `autocomplete_test.go`:
- Unit tests for translation resolution
- Tests for language detection from headers
- Integration tests with full request flow
- Tests for all supported languages
- Fallback to English test

## Notes
- If a requested language field doesn't exist on the `TranslatedString`, it falls back to English
- If no language header is provided, English is used by default
- The feature is backward compatible - models without `TranslatedString` fields work unchanged
- Nil pointer `TranslatedString` fields are handled gracefully (return empty string)

