package sqlite

import (
	"context"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestNewSqliteDatabase(t *testing.T) {
	sqlite, err := NewMemorySqliteDatabase("test", false)
	assert.NoError(t, err)
	assert.NotNil(t, sqlite)

	ctx := context.Background()

	_, err = sqlite.DB.NewRaw("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)").Exec(ctx)
	assert.NoError(t, err)

	//noinspection SqlResolve
	_, err = sqlite.DB.NewRaw("INSERT INTO test (name) VALUES ('test')").Exec(ctx)
	assert.NoError(t, err)

	var name string
	//noinspection SqlResolve
	_, err = sqlite.DB.NewRaw("SELECT name FROM test WHERE id = ?", 1).Exec(ctx, &name)
	assert.NoError(t, err)
	assert.Equal(t, "test", name)
}
