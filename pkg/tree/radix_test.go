package tree

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func TestRadixTree(t *testing.T) {
	tr := NewRadixTree()

	tr.Insert("1", 1)
	tr.Insert("12", 2)

	_, i, b := tr.LongestPrefix("123")
	require.True(t, b)
	require.Equal(t, i, 2)
}
