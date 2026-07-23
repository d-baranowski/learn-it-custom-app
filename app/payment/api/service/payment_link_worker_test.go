package service

import (
	"pkg/decimal"
	"testing"
)

func TestToStripeMinorUnits(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name string
		in   string
		want int64
	}{
		{"whole PLN", "230", 23000},
		{"with grosze", "12.34", 1234},
		{"trailing zeros", "150.00", 15000},
		{"rounds half grosz up", "12.345", 1235},
		{"zero", "0", 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			amount, err := decimal.NewFromString(tc.in)
			if err != nil {
				t.Fatalf("invalid input %q: %v", tc.in, err)
			}

			got := toStripeMinorUnits(amount)
			if got != tc.want {
				t.Errorf("toStripeMinorUnits(%s) = %d, want %d", tc.in, got, tc.want)
			}
		})
	}
}
