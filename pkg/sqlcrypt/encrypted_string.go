package sqlcrypt

import (
	"bytes"
	"database/sql/driver"
	"fmt"
	jsoniter "github.com/json-iterator/go"
)

//var (
//	_ driver.Valuer    = &EncryptedString{}
//	_ sql.Scanner      = &EncryptedString{}
//	_ json.Marshaler   = &EncryptedString{}
//	_ json.Unmarshaler = &EncryptedString{}
//)

func NewEncryptedString(s string) EncryptedString {
	if s == "" {
		return ""
	}

	return EncryptedString(s)
}

type EncryptedString string

func (e EncryptedString) String() string {
	return string(e)
}

func (e EncryptedString) Bytes() []byte {
	return []byte(e)
}

// Scan implements the scanner interface
func (e *EncryptedString) Scan(value interface{}) error {
	// value could be nil, bytes or string
	var b []byte
	switch v := value.(type) {
	case nil:
		return nil
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("failed to read value")
	}

	// Dont attempt to decrypt if value is nil
	if b == nil {
		return nil
	}

	// Decrypt value to e
	reader := bytes.NewReader(b)
	writer := new(bytes.Buffer)

	if err := Decrypt(writer, reader); err != nil {
		return err
	}

	*e = EncryptedString(writer.Bytes())

	return nil
}

// Value implements the valuer interface
func (e EncryptedString) Value() (driver.Value, error) {
	// nil will be stored as null in the database
	if len(e) == 0 {
		var b []byte
		return b, nil
	}

	// Encrypt contents of e before storing in the database
	reader := bytes.NewReader(e.Bytes())
	writer := new(bytes.Buffer)

	if err := Encrypt(writer, reader); err != nil {
		return nil, err
	}

	return writer.Bytes(), nil
}

// MarshalJSON implements json.Marshaler interface
func (e EncryptedString) MarshalJSON() ([]byte, error) {
	return jsoniter.Marshal(e.String())
}

// UnmarshalJSON implements json.Unmarshaler interface
func (e *EncryptedString) UnmarshalJSON(data []byte) error {
	var alias string
	if err := jsoniter.Unmarshal(data, &alias); err != nil {
		return err
	}

	*e = EncryptedString(alias)

	return nil
}
