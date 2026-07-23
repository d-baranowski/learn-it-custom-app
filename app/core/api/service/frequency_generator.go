package service

import (
	"fmt"
	"sort"
	"time"

	"pkg/unix"
)

// FrequencyItem represents a frequency configuration item
// This is a generic interface that both SessionFrequencyItem and RecurringCashflowFrequencyItem satisfy
type FrequencyItem interface {
	GetEvery() int
	GetOnDay() []int
	GetStartTimeMs() *unix.Timestamp
	GetUnit() int
}

// FrequencyGenerator provides a generic frequency expansion algorithm
// that can be used for both Therapy/Session and RecurringCashflow/Transaction
type FrequencyGenerator[T any] struct {
	// Start and end dates for the generation window
	start time.Time
	end   time.Time

	// location is the timezone used to interpret local recurrence dates/times.
	location *time.Location

	// Frequency configurations
	frequencies []FrequencyItem

	// parentId is the ID of the parent entity (e.g., therapyId or recurringCashflowId)
	parentId string

	// createdBy is the user who created the parent entity
	createdBy string

	// now is the current timestamp
	now unix.Timestamp

	// buildEntity is a callback that creates an entity for a specific occurrence
	// Parameters: occur (date), startTimeMs (time of day), ref (frequency reference), fi (frequency index)
	buildEntity func(occur time.Time, startTimeMs int64, ref string, fi int) (T, error)
}

// NewFrequencyGenerator creates a new frequency generator
func NewFrequencyGenerator[T any](
	start time.Time,
	end time.Time,
	location *time.Location,
	frequencies []FrequencyItem,
	parentId string,
	createdBy string,
	now unix.Timestamp,
	buildEntity func(occur time.Time, startTimeMs int64, ref string, fi int) (T, error),
) *FrequencyGenerator[T] {
	if location == nil {
		location = time.UTC
	}

	return &FrequencyGenerator[T]{
		start:       start,
		end:         end,
		location:    location,
		frequencies: frequencies,
		parentId:    parentId,
		createdBy:   createdBy,
		now:         now,
		buildEntity: buildEntity,
	}
}

// Generate generates all occurrences based on the frequency configurations
func (fg *FrequencyGenerator[T]) Generate() ([]T, error) {
	if !fg.start.Before(fg.end) {
		return nil, nil // avoid invalid window
	}

	results := make([]T, 0, 128)

	// Default to 09:00 (in ms from midnight) when not provided.
	const defaultStartTimeMs int64 = 9 * 60 * 60 * 1000
	const msPerDay int64 = 24 * 60 * 60 * 1000

	// Clamp/sanitize time-of-day.
	sanitizeStartTimeMs := func(v *int64) int64 {
		if v == nil {
			return defaultStartTimeMs
		}
		if *v < 0 {
			return 0
		}
		if *v >= msPerDay {
			return msPerDay - 1
		}
		return *v
	}

	for fi, freq := range fg.frequencies {
		if freq.GetEvery() <= 0 {
			continue
		}
		onDays := append([]int(nil), freq.GetOnDay()...)
		sort.Ints(onDays)

		startTimeMs := sanitizeStartTimeMs(freq.GetStartTimeMs().Int64Ptr())

		// Default to WEEK (1) if unit is not specified or is 0 (UNSPECIFIED)
		unit := freq.GetUnit()
		if unit == 0 {
			unit = 1 // WEEK
		}

		// Iterate based on unit (week or month)
		if unit == 2 { // MONTH
			occurrences, err := fg.generateMonthlyOccurrences(fi, freq, onDays, startTimeMs)
			if err != nil {
				return nil, err
			}
			results = append(results, occurrences...)
		} else { // WEEK (default)
			occurrences, err := fg.generateWeeklyOccurrences(fi, onDays, startTimeMs, freq.GetEvery())
			if err != nil {
				return nil, err
			}
			results = append(results, occurrences...)
		}
	}

	return results, nil
}

// generateMonthlyOccurrences generates occurrences for monthly frequencies
func (fg *FrequencyGenerator[T]) generateMonthlyOccurrences(
	fi int,
	freq FrequencyItem,
	onDays []int,
	startTimeMs int64,
) ([]T, error) {
	results := make([]T, 0)

	// Iterate through each calendar month in the range
	currentMonth := time.Date(fg.start.Year(), fg.start.Month(), 1, 0, 0, 0, 0, fg.location)
	monthCount := 0

	for !currentMonth.After(fg.end) {
		// Only process this month if it's the right interval
		// For "every N months", we check if monthCount is divisible by N
		if monthCount%freq.GetEvery() == 0 {
			firstOfMonth := currentMonth

			// For each selected day of the week, find the first occurrence in this month
			for _, day := range onDays {
				// Find the first occurrence of the target day in this month
				// Start from the first day of the month
				baseWd := int(firstOfMonth.Weekday())
				if baseWd == 0 {
					baseWd = 7 // Convert Sunday from 0 to 7 (ISO 8601)
				}

				// Calculate offset to the first occurrence of the target day
				offset := (day - baseWd + 7) % 7
				firstOccurrence := firstOfMonth.AddDate(0, 0, offset)

				// Make sure the occurrence is within our valid range [start, end]
				if firstOccurrence.Before(fg.start) || firstOccurrence.After(fg.end) {
					continue
				}

				// Apply wall-clock time-of-day in the configured local timezone.
				occurMidnight := time.Date(firstOccurrence.Year(), firstOccurrence.Month(), firstOccurrence.Day(), 0, 0, 0, 0, fg.location)
				occurStart := occurMidnight.Add(time.Duration(startTimeMs) * time.Millisecond)

				ref := fmt.Sprintf("%s|f%d|%04d%02d%02d|t%d", fg.parentId, fi, firstOccurrence.Year(), firstOccurrence.Month(), firstOccurrence.Day(), startTimeMs)

				entity, err := fg.buildEntity(occurStart, startTimeMs, ref, fi)
				if err != nil {
					return nil, err
				}
				results = append(results, entity)
			}
		}

		// Move to next month
		currentMonth = currentMonth.AddDate(0, 1, 0)
		monthCount++
	}

	return results, nil
}

// generateWeeklyOccurrences generates occurrences for weekly frequencies
func (fg *FrequencyGenerator[T]) generateWeeklyOccurrences(
	fi int,
	onDays []int,
	startTimeMs int64,
	every int,
) ([]T, error) {
	results := make([]T, 0)

	// Iterate weeks from start to end.
	for weekStart := fg.start; !weekStart.After(fg.end); weekStart = weekStart.AddDate(0, 0, 7*every) {
		// Convert Go's weekday (0=Sunday) to ISO 8601 (1=Monday, 7=Sunday)
		baseWd := int(weekStart.Weekday())
		if baseWd == 0 {
			baseWd = 7
		}

		for _, day := range onDays {
			// Calculate offset from current weekday to target day (both in ISO 8601 format: 1-7)
			offset := (day - baseWd + 7) % 7
			occur := weekStart.AddDate(0, 0, offset)
			if occur.Before(fg.start) || occur.After(fg.end) {
				continue
			}

			// Apply wall-clock time-of-day in the configured local timezone.
			occurMidnight := time.Date(occur.Year(), occur.Month(), occur.Day(), 0, 0, 0, 0, fg.location)
			occurStart := occurMidnight.Add(time.Duration(startTimeMs) * time.Millisecond)

			ref := fmt.Sprintf("%s|f%d|%04d%02d%02d|t%d", fg.parentId, fi, occur.Year(), occur.Month(), occur.Day(), startTimeMs)

			entity, err := fg.buildEntity(occurStart, startTimeMs, ref, fi)
			if err != nil {
				return nil, err
			}
			results = append(results, entity)
		}
	}

	return results, nil
}
