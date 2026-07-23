package service

import (
	"testing"
	"time"

	"pkg/unix"
)

// mockFrequencyItem implements the FrequencyItem interface for testing
type mockFrequencyItem struct {
	every       int
	onDay       []int
	startTimeMs *unix.Timestamp
	unit        int
}

func (m *mockFrequencyItem) GetEvery() int                   { return m.every }
func (m *mockFrequencyItem) GetOnDay() []int                 { return m.onDay }
func (m *mockFrequencyItem) GetStartTimeMs() *unix.Timestamp { return m.startTimeMs }
func (m *mockFrequencyItem) GetUnit() int                    { return m.unit }

// testEntity is a simple entity for testing
type testEntity struct {
	occurTime time.Time
	ref       string
}

func TestFrequencyGenerator_WeeklyFrequency(t *testing.T) {
	start := time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC) // Monday, Jan 5, 2026
	end := time.Date(2026, 2, 2, 0, 0, 0, 0, time.UTC)   // Monday, Feb 2, 2026

	startTimeMs := int64(9 * 60 * 60 * 1000) // 09:00
	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       1,           // every week
			onDay:       []int{1, 3}, // Monday and Wednesday
			startTimeMs: unix.Int64PtrToTimestamp(&startTimeMs),
			unit:        1, // WEEK
		},
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		frequencies,
		"test-parent-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	// We expect occurrences on every Monday and Wednesday between Jan 5 and Feb 2
	// Jan: 5(Mon), 7(Wed), 12(Mon), 14(Wed), 19(Mon), 21(Wed), 26(Mon), 28(Wed)
	// Feb: 2(Mon)
	// Total: 9 occurrences
	expectedCount := 9
	if len(results) != expectedCount {
		t.Errorf("Expected %d occurrences, got %d", expectedCount, len(results))
	}

	// Verify the first occurrence is on Monday, Jan 5 at 09:00
	if len(results) > 0 {
		firstOccur := results[0].occurTime
		expected := time.Date(2026, 1, 5, 9, 0, 0, 0, time.UTC)
		if !firstOccur.Equal(expected) {
			t.Errorf("Expected first occurrence at %v, got %v", expected, firstOccur)
		}
	}
}

func TestFrequencyGenerator_MonthlyFrequency(t *testing.T) {
	start := time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC) // March 2, 2026 (Monday)
	end := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)

	startTimeMs := int64(10 * 60 * 60 * 1000) // 10:00
	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       2,        // every 2 months
			onDay:       []int{1}, // Monday
			startTimeMs: unix.Int64PtrToTimestamp(&startTimeMs),
			unit:        2, // MONTH
		},
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		frequencies,
		"test-cashflow-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	// Every 2 months starting from March: March, May, July, September, November
	// Expected: 5 occurrences
	expectedCount := 5
	if len(results) != expectedCount {
		t.Errorf("Expected %d occurrences, got %d", expectedCount, len(results))
		for i, r := range results {
			t.Logf("  [%d] %v", i, r.occurTime.Format("2006-01-02 15:04"))
		}
	}

	// Verify months
	expectedMonths := []time.Month{
		time.March, time.May, time.July, time.September, time.November,
	}
	for i, expectedMonth := range expectedMonths {
		if i >= len(results) {
			t.Errorf("Missing occurrence for month %v", expectedMonth)
			continue
		}
		if results[i].occurTime.Month() != expectedMonth {
			t.Errorf("Expected occurrence %d in %v, got %v", i, expectedMonth, results[i].occurTime.Month())
		}
		// Verify time is 10:00
		if results[i].occurTime.Hour() != 10 {
			t.Errorf("Expected hour 10, got %d", results[i].occurTime.Hour())
		}
	}
}

func TestFrequencyGenerator_EmptyFrequencies(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)

	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		[]FrequencyItem{},
		"test-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	if len(results) != 0 {
		t.Errorf("Expected 0 occurrences for empty frequencies, got %d", len(results))
	}
}

func TestFrequencyGenerator_InvalidWindow(t *testing.T) {
	start := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC) // end before start

	startTimeMs := int64(9 * 60 * 60 * 1000)
	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       1,
			onDay:       []int{1},
			startTimeMs: unix.Int64PtrToTimestamp(&startTimeMs),
			unit:        1,
		},
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		frequencies,
		"test-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	// Should return empty results for invalid window
	if len(results) != 0 {
		t.Errorf("Expected 0 occurrences for invalid window, got %d", len(results))
	}
}

func TestFrequencyGenerator_DefaultStartTime(t *testing.T) {
	start := time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 1, 6, 0, 0, 0, 0, time.UTC)

	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       1,
			onDay:       []int{1}, // Monday
			startTimeMs: nil,      // should default to 09:00
			unit:        1,
		},
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		frequencies,
		"test-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	if len(results) != 1 {
		t.Errorf("Expected 1 occurrence, got %d", len(results))
	}

	// Verify default time is 09:00
	if len(results) > 0 {
		if results[0].occurTime.Hour() != 9 || results[0].occurTime.Minute() != 0 {
			t.Errorf("Expected default time 09:00, got %02d:%02d",
				results[0].occurTime.Hour(), results[0].occurTime.Minute())
		}
	}
}

func TestFrequencyGenerator_ReferenceFormat(t *testing.T) {
	start := time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, 1, 6, 0, 0, 0, 0, time.UTC)

	startTimeMs := int64(10 * 60 * 60 * 1000) // 10:00
	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       1,
			onDay:       []int{1},
			startTimeMs: unix.Int64PtrToTimestamp(&startTimeMs),
			unit:        1,
		},
	}

	parentId := "parent-123"
	generator := NewFrequencyGenerator(
		start,
		end,
		time.UTC,
		frequencies,
		parentId,
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	if len(results) != 1 {
		t.Errorf("Expected 1 occurrence, got %d", len(results))
	}

	// Verify reference format: "parentId|f{fi}|YYYYMMDD|t{startTimeMs}"
	expectedRef := "parent-123|f0|20260105|t36000000"
	if len(results) > 0 && results[0].ref != expectedRef {
		t.Errorf("Expected reference %q, got %q", expectedRef, results[0].ref)
	}
}

func TestFrequencyGenerator_WeeklyFrequency_PreservesLocalTimeAcrossDST(t *testing.T) {
	location, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		t.Fatalf("LoadLocation() failed: %v", err)
	}

	start := time.Date(2026, 3, 23, 0, 0, 0, 0, location)
	end := time.Date(2026, 4, 6, 0, 0, 0, 0, location)

	startTimeMs := int64(18 * 60 * 60 * 1000) // 18:00 local wall-clock time
	frequencies := []FrequencyItem{
		&mockFrequencyItem{
			every:       1,
			onDay:       []int{1}, // Monday
			startTimeMs: unix.Int64PtrToTimestamp(&startTimeMs),
			unit:        1,
		},
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		location,
		frequencies,
		"test-parent-id",
		"test-user",
		unix.Now(),
		func(occur time.Time, startTimeMs int64, ref string, fi int) (*testEntity, error) {
			return &testEntity{
				occurTime: occur,
				ref:       ref,
			}, nil
		},
	)

	results, err := generator.Generate()
	if err != nil {
		t.Fatalf("Generate() failed: %v", err)
	}

	if len(results) != 3 {
		t.Fatalf("Expected 3 occurrences, got %d", len(results))
	}

	for i, result := range results {
		localTime := result.occurTime.In(location)
		if localTime.Hour() != 18 || localTime.Minute() != 0 {
			t.Fatalf("Expected occurrence %d to stay at 18:00 local, got %v", i, localTime)
		}
	}

	if got := results[0].occurTime.UTC().Hour(); got != 17 {
		t.Fatalf("Expected pre-DST UTC hour 17, got %d", got)
	}

	if got := results[1].occurTime.UTC().Hour(); got != 16 {
		t.Fatalf("Expected post-DST UTC hour 16, got %d", got)
	}
}
