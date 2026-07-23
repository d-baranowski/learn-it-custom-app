package ctxHelpers

import (
	"context"
	"language"
	"net/http"
	"strings"
)

const (
	CtxRequestHeaders = "request-headers"
)

func GetContextRequestHeaders(ctx context.Context) (http.Header, bool) {
	headers, ok := ctx.Value(CtxRequestHeaders).(http.Header)
	if !ok {
		return nil, false
	}
	return headers, true
}

func SetContextRequestHears(ctx context.Context, headers http.Header) context.Context {
	return context.WithValue(ctx, CtxRequestHeaders, headers)
}

// GetLanguageFromContext extracts the language from context headers and returns
// the normalized language code (en, pl, vi). Falls back to "en" if not found.
func GetLanguageFromContext(ctx context.Context) string {
	if headers, ok := GetContextRequestHeaders(ctx); ok {
		matchedLang := language.MatchHeaderLanguage(headers)
		if matchedLang != "" {
			return NormalizeLanguageCode(matchedLang)
		}
	}
	return "en" // default fallback
}

// NormalizeLanguageCode converts language codes to their base form
// (e.g., "en-US" -> "en", "pl-PL" -> "pl", "vi-VN" -> "vi")
func NormalizeLanguageCode(lang string) string {
	switch strings.ToLower(lang) {
	case "en", "en-us", "en-gb":
		return "en"
	case "pl", "pl-pl":
		return "pl"
	case "vi", "vi-vn":
		return "vi"
	default:
		return "en" // fallback to English
	}
}

// LanguageCodeToFieldName converts a normalized language code to a TranslatedString field name
// (e.g., "en" -> "En", "pl" -> "Pl", "vi" -> "Vi")
func LanguageCodeToFieldName(lang string) string {
	normalized := NormalizeLanguageCode(lang)
	switch normalized {
	case "en":
		return "En"
	case "pl":
		return "Pl"
	case "vi":
		return "Vi"
	default:
		return "En"
	}
}

func SetLanguageInContext(ctx context.Context, lang string) context.Context {
	headers := http.Header{}
	headers.Set("X-I18next-Lng", NormalizeLanguageCode(lang))
	return SetContextRequestHears(ctx, headers)
}
