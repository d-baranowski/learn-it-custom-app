package repository

import (
	"github.com/stretchr/testify/assert"
	requestv1 "pkg/request/gen/request/v1"
	"testing"
)

func TestGetEnumOrder(t *testing.T) {
	enum := requestv1.WhereOperator(0)
	_, ok, err := GetEnumOrder(enum.Descriptor())
	assert.NoError(t, err)
	assert.True(t, ok, "expected enum 'WhereOperator' to be found")
}
