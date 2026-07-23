package aesgcm

import (
	"bytes"
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/assert"

	sqlcrypter "pkg/sqlcrypt"
)

func Test_New(t *testing.T) {
	t.Run("invalid key length", func(t *testing.T) {
		key, _ := sqlcrypter.GenerateBytes(16)

		_, err := New(key, nil)
		assert.NotNil(t, err)
		assert.Contains(t, err.Error(), "DEK is invalid")
	})

	t.Run("current key", func(t *testing.T) {
		key, _ := sqlcrypter.GenerateBytes(32)

		aesCrypter, err := New(key, nil)
		assert.NoError(t, err)
		assert.IsType(t, &AESCrypter{}, aesCrypter)
	})

	t.Run("invalid previous key length", func(t *testing.T) {
		current, _ := sqlcrypter.GenerateBytes(32)
		previous := []byte("2819b0fcd8bfa185bd724fb5")

		_, err := New(current, previous)
		assert.NotNil(t, err)
		assert.Contains(t, err.Error(), "previous DEK is invalid")
	})

	t.Run("both keys", func(t *testing.T) {
		current, _ := sqlcrypter.GenerateBytes(32)
		previous, _ := sqlcrypter.GenerateBytes(32)

		aesCrypter, err := New(current, previous)
		assert.NoError(t, err)
		assert.IsType(t, &AESCrypter{}, aesCrypter)
	})
}

func Test_AESCryptor_Encrypt(t *testing.T) {
	key := []byte("aa6df350c6164fe8a674864fd1204fe9")

	plaintext := "Hello World"

	reader := bytes.NewBufferString(plaintext)
	writer := new(bytes.Buffer)

	a, _ := New(key, nil)

	err := a.Encrypt(writer, reader)
	assert.NoError(t, err)
	assert.NotEqual(t, plaintext, writer.String())

	t.Run("err", func(t *testing.T) {
		current, _ := sqlcrypter.GenerateBytes(32)
		previous, _ := sqlcrypter.GenerateBytes(32)

		aesCrypter, err := New(current, previous)
		assert.NoError(t, err)
		assert.IsType(t, &AESCrypter{}, aesCrypter)
	})
}

func Test_AESCryptor_Decrypt(t *testing.T) {
	key := []byte("aa6df350c6164fe8a674864fd1204fe9")

	plaintext := "Hello World"

	// encrypted "Hello World" as bytes
	ciphertext := []byte{21, 233, 48, 137, 56, 251, 145, 11, 56, 123, 233, 232, 122, 17, 207, 165, 44, 60, 21, 17, 115, 141, 218, 29, 153, 53, 177, 173, 4, 210, 243, 228, 78, 218, 146, 182, 78, 175, 33}

	t.Run("decrypt error", func(t *testing.T) {
		a, _ := New(key, nil)

		reader := bytes.NewReader([]byte("invalid ciphertext"))
		writer := new(bytes.Buffer)

		err := a.Decrypt(writer, reader)
		assert.NotNil(t, err)
		assert.Contains(t, err.Error(), "failed to decrypt ciphertext using current DEK")
	})

	t.Run("decrypt error both keys", func(t *testing.T) {
		previousKey, _ := sqlcrypter.GenerateBytes(32)

		a, _ := New(key, previousKey)

		reader := bytes.NewReader([]byte("invalid ciphertext"))
		writer := new(bytes.Buffer)

		err := a.Decrypt(writer, reader)
		assert.NotNil(t, err)
		assert.Contains(t, err.Error(), "failed to decrypt ciphertext using current and previous DEK")
	})

	t.Run("no previous key", func(t *testing.T) {
		a, _ := New(key, nil)

		reader := bytes.NewReader(ciphertext)
		writer := new(bytes.Buffer)

		err := a.Decrypt(writer, reader)
		assert.NoError(t, err)
		assert.Equal(t, plaintext, writer.String())
	})

	t.Run("decrypt with previous key", func(t *testing.T) {
		key := []byte("e4d274d893b4d35e7c54b7947f6b348b")
		previousKey := []byte("aa6df350c6164fe8a674864fd1204fe9")

		// Hello World as encrypted bytes
		ciphertext := []byte{21, 233, 48, 137, 56, 251, 145, 11, 56, 123, 233, 232, 122, 17, 207, 165, 44, 60, 21, 17, 115, 141, 218, 29, 153, 53, 177, 173, 4, 210, 243, 228, 78, 218, 146, 182, 78, 175, 33}

		plaintext := "Hello World"

		reader := bytes.NewReader(ciphertext)
		writer := new(bytes.Buffer)

		a, _ := New(key, previousKey)

		err := a.Decrypt(writer, reader)
		assert.NoError(t, err)
		assert.Equal(t, plaintext, writer.String())
	})

	t.Run("decrypt with current key", func(t *testing.T) {
		key := []byte("aa6df350c6164fe8a674864fd1204fe9")
		previousKey := []byte("e4d274d893b4d35e7c54b7947f6b348b")

		// Hello World as encrypted bytes
		ciphertext := []byte{21, 233, 48, 137, 56, 251, 145, 11, 56, 123, 233, 232, 122, 17, 207, 165, 44, 60, 21, 17, 115, 141, 218, 29, 153, 53, 177, 173, 4, 210, 243, 228, 78, 218, 146, 182, 78, 175, 33}

		plaintext := "Hello World"

		reader := bytes.NewReader(ciphertext)
		writer := new(bytes.Buffer)

		a, _ := New(key, previousKey)

		err := a.Decrypt(writer, reader)
		assert.NoError(t, err)
		assert.Equal(t, plaintext, writer.String())
	})

	t.Run("decrypt debug", func(t *testing.T) {
		t.Skip("debugging")

		key, err := hex.DecodeString("fb7f69d3f824045c2685ad859593470df11e45256480802517cb20fc19b0d15e")
		if err != nil {
			t.Fatal(err)
		}

		// Hello World as encrypted bytes
		ciphertext := []byte("\\x29e74cf52052531af1a1633275f596dd965d68f21993cb155905fbb0e4e1983aa30db51f")

		plaintext := "Hello World"

		reader := bytes.NewReader(ciphertext)
		writer := new(bytes.Buffer)

		a, _ := New(key, nil)

		err = a.Decrypt(writer, reader)
		assert.NoError(t, err)
		assert.Equal(t, plaintext, writer.String())
	})
}

func Test_AESCryptor_Password(t *testing.T) {
	key, err := hex.DecodeString("fb7f69d3f824045c2685ad859593470df11e45256480802517cb20fc19b0d15e")
	if err != nil {
		t.Fatal(err)
	}

	plaintext := "password"

	reader := bytes.NewBufferString(plaintext)
	writer := new(bytes.Buffer)

	a, _ := New(key, nil)

	err = a.Encrypt(writer, reader)
	assert.NoError(t, err)
	assert.NotEqual(t, plaintext, writer.String())

	// dump writer to hex
	t.Logf("encrypted password: %x", writer.Bytes())
}
