package decimal

import (
	jsoniter "github.com/json-iterator/go"
	"strings"
)

const Scale = int32(8)

type RedisDecimal struct {
	Decimal
}

// string
func (m RedisDecimal) String() string {
	return m.Decimal.Shift(Scale).String()
}

func (m RedisDecimal) MarshalBinary() ([]byte, error) {
	return m.Decimal.Shift(Scale).MarshalText()
}

func (m *RedisDecimal) UnmarshalBinary(data []byte) error {
	err := m.Decimal.UnmarshalText(data)
	if err != nil {
		return err
	}
	m.Decimal = m.Decimal.Shift(-Scale)
	return nil
}

func (m RedisDecimal) MarshalJSON() ([]byte, error) {
	if m.Decimal.Equal(Zero) {
		return jsoniter.Marshal(0)
	}
	val := m.Decimal.Shift(Scale).IntPart()
	return jsoniter.Marshal(val)
}

func (m *RedisDecimal) UnmarshalJSON(data []byte) error {
	str := string(data)

	// todo: hack, fix it upstream
	// remove double quotes if present
	if len(str) > 1 && str[0] == '"' && str[len(str)-1] == '"' {
		str = str[1 : len(str)-1]
	}

	if str == "0" {
		m.Decimal = Zero
		return nil
	}
	if strings.Contains(str, ".") {
		var val Decimal
		err := jsoniter.Unmarshal(data, &val)
		if err != nil {
			return err
		}
		m.Decimal = val
		return nil
	}
	var val int64
	err := jsoniter.UnmarshalFromString(str, &val)
	if err != nil {
		return err
	}
	m.Decimal = NewFromInt(val).Shift(-Scale)
	return nil
}
