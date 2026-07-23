package decimal

import (
	"fmt"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestScaleUp(t *testing.T) {
	d, _ := NewFromString("0.00000001")
	scaled := d.Shift(Scale).IntPart()
	fmt.Println(scaled)
}

func TestScaleDown(t *testing.T) {
	d, _ := NewFromString("1")
	scaled := d.Shift(-Scale)
	fmt.Println(scaled)
}

func TestMarshalBinary(t *testing.T) {
	expected := []byte{0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30}
	d, _ := NewFromString("1")
	m := RedisDecimal{d}
	b, _ := m.MarshalBinary()
	require.Equal(t, expected, b)
}

func TestUnmarshalBinary(t *testing.T) {
	expected, err := NewFromString("1.23456789")
	require.NoError(t, err)
	d, _ := NewFromString("1.23456789")
	m := RedisDecimal{d}
	b, err := m.MarshalBinary()
	require.NoError(t, err)
	err = m.UnmarshalBinary(b)
	require.NoError(t, err)
	require.Equal(t, expected.String(), m.Decimal.String())
}

func TestInt64(t *testing.T) {
	d := New(101, -10)
	fmt.Println(d.String())
}
