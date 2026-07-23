package service

import (
	"fmt"
	"testing"
	"time"
)

func TestMonthlyFrequencyLogic(t *testing.T) {
	tests := []struct {
		name           string
		startDate      time.Time
		endDate        time.Time
		every          int
		onDay          []int // ISO 8601: 1=Monday, 7=Sunday
		expectedMonths []string
	}{
		{
			name:      "Every 1 month on Monday - should generate one transaction per month",
			startDate: time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC), // March 2, 2026 (Monday)
			endDate:   time.Date(2027, 2, 28, 0, 0, 0, 0, time.UTC),
			every:     1,
			onDay:     []int{1}, // Monday
			// Should get first Monday of each month from March 2026 to February 2027
			expectedMonths: []string{
				"2026-03", "2026-04", "2026-05", "2026-06",
				"2026-07", "2026-08", "2026-09", "2026-10",
				"2026-11", "2026-12", "2027-01", "2027-02",
			},
		},
		{
			name:      "Every 2 months on Monday - should skip alternate months",
			startDate: time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC),
			endDate:   time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC),
			every:     2,
			onDay:     []int{1}, // Monday
			expectedMonths: []string{
				"2026-03", "2026-05", "2026-07", "2026-09", "2026-11",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			start := tt.startDate
			end := tt.endDate
			every := tt.every
			onDays := tt.onDay

			// Simulate the new algorithm
			currentMonth := time.Date(start.Year(), start.Month(), 1, 0, 0, 0, 0, time.UTC)
			monthCount := 0
			var generatedMonths []string

			for !currentMonth.After(end) {
				if monthCount%every == 0 {
					firstOfMonth := currentMonth

					for _, day := range onDays {
						baseWd := int(firstOfMonth.Weekday())
						if baseWd == 0 {
							baseWd = 7
						}

						offset := (day - baseWd + 7) % 7
						firstOccurrence := firstOfMonth.AddDate(0, 0, offset)

						if firstOccurrence.Before(start) || firstOccurrence.After(end) {
							continue
						}

						monthKey := fmt.Sprintf("%d-%02d", firstOccurrence.Year(), firstOccurrence.Month())
						generatedMonths = append(generatedMonths, monthKey)
						t.Logf("Generated transaction for %s on %s", monthKey, firstOccurrence.Format("2006-01-02"))
					}
				}

				currentMonth = currentMonth.AddDate(0, 1, 0)
				monthCount++
			}

			// Check results
			if len(generatedMonths) != len(tt.expectedMonths) {
				t.Errorf("Expected %d months, got %d", len(tt.expectedMonths), len(generatedMonths))
				t.Errorf("Expected: %v", tt.expectedMonths)
				t.Errorf("Got:      %v", generatedMonths)
				return
			}

			for i, expected := range tt.expectedMonths {
				if i >= len(generatedMonths) || generatedMonths[i] != expected {
					t.Errorf("Month %d: expected %s, got %s", i, expected, generatedMonths[i])
				}
			}
		})
	}
}
