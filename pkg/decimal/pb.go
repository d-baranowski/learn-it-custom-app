package decimal

import (
	"go.uber.org/zap"
	pbDecimal "google.golang.org/genproto/googleapis/type/decimal"
)

func MapPbToDecimal(m *pbDecimal.Decimal) (*Decimal, error) {
	zero := NewFromInt(int64(0))
	if m == nil {
		return &zero, nil
	}

	val, err := NewFromString(m.Value)
	if err != nil {
		zap.L().Error("failed to unmarshal decimal from pb", zap.Error(err))
		return nil, err
	}

	return &val, nil
}

func MapDecimalToPb(m *Decimal) *pbDecimal.Decimal {
	return &pbDecimal.Decimal{
		Value: m.String(),
	}
}

type GoogleDecimal struct {
	Value string `json:"value"`
}
