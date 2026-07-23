package sqlcrypt

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_NewEncryptedString(t *testing.T) {
	t.Run("empty string", func(t *testing.T) {
		e := NewEncryptedString("")
		assert.Equal(t, "", e.String())
	})

	t.Run("success", func(t *testing.T) {
		s := "Hello World"
		e := NewEncryptedString(s)
		assert.Equal(t, s, e.String())
	})
}

func Test_EncryptedString_Scan(t *testing.T) {
	Init(&TestCrypter{})

	t.Run("empty value", func(t *testing.T) {
		e := NewEncryptedString("")
		var b []byte
		err := e.Scan(b)
		assert.NoError(t, err)
		assert.Equal(t, e.String(), "")
	})
	t.Run("decrypt", func(t *testing.T) {
		e := NewEncryptedString("")
		err := e.Scan([]byte("SGVsbG8gV29ybGQ="))
		assert.NoError(t, err)
		assert.Equal(t, "Hello World", e.String())
	})
}

func Test_EncryptedString_Value(t *testing.T) {
	Init(&TestCrypter{})

	t.Run("nil value", func(t *testing.T) {
		e := NewEncryptedString("")
		var b []byte
		d, err := e.Value()
		assert.NoError(t, err)
		assert.Equal(t, b, d)
	})

	t.Run("encrypt", func(t *testing.T) {
		e := NewEncryptedString("Hello World")
		d, err := e.Value()
		assert.NoError(t, err)

		b, ok := d.([]byte)
		assert.True(t, ok)
		assert.Equal(t, string(b), "SGVsbG8gV29ybGQ=")
	})
}

func Test_EncryptedString_MarshalJSON(t *testing.T) {
	Init(&TestCrypter{})

	m := map[string]EncryptedString{
		"v": NewEncryptedString("Hello World"),
	}

	b, err := json.Marshal(m)
	assert.NoError(t, err)
	assert.Equal(t, `{"v":"Hello World"}`, string(b))
}

func Test_EncryptedString_UnmarshalJSON(t *testing.T) {
	Init(&TestCrypter{})

	data := []byte(`{"secret":"Hello World"}`)

	type Example struct {
		Secret EncryptedString
	}

	var e Example

	err := json.Unmarshal(data, &e)
	assert.NoError(t, err)
	assert.Equal(t, "Hello World", e.Secret.String())
}
