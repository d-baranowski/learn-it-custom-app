package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRenderJsonAccessor_EmptyPath(t *testing.T) {
	// When no sub-path is specified (the filter targets the whole JSONB object),
	// renderJsonAccessor must return "::text" so that text operators like ILIKE
	// can be applied via a cast rather than against the raw jsonb type.
	result := renderJsonAccessor("")
	assert.Equal(t, "::text", result,
		"empty path should produce ::text cast to allow ILIKE on the full JSONB value")
}

func TestRenderJsonAccessor_SingleKey(t *testing.T) {
	result := renderJsonAccessor("en")
	assert.Equal(t, "->>'en'", result)
}

func TestRenderJsonAccessor_NestedPath(t *testing.T) {
	result := renderJsonAccessor("address.city")
	assert.Equal(t, "->'address'->>'city'", result)
}

func TestRenderJsonAccessor_DeeplyNestedPath(t *testing.T) {
	result := renderJsonAccessor("a.b.c")
	assert.Equal(t, "->'a'->'b'->>'c'", result)
}
