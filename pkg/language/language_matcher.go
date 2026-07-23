package language

import (
	"net/http"

	"golang.org/x/text/language"
)

func MatchHeaderLanguage(headers http.Header) string {
	supported := []language.Tag{
		language.English,
		language.Polish,
		language.Vietnamese,
	}

	// Prioritize X-I18next-Lng header if present
	if i18nextLng := headers.Get("X-I18next-Lng"); i18nextLng != "" {
		if tag, err := language.Parse(i18nextLng); err == nil {
			matcher := language.NewMatcher(supported)
			matchedTag, _, _ := matcher.Match(tag)
			return matchedTag.String()
		}
	}

	// Fall back to Accept-Language header
	acceptLanguage := headers.Get("Accept-Language")

	matcher := language.NewMatcher(supported)
	tag, _ := language.MatchStrings(matcher, acceptLanguage)

	return tag.String()
}
