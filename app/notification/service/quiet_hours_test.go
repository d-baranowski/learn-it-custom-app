package service

import (
	"testing"
	"time"
)

func mustLoadLoc(t *testing.T, name string) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation(name)
	if err != nil {
		t.Fatalf("load location %q: %v", name, err)
	}
	return loc
}

func TestNewQuietHours_Disabled(t *testing.T) {
	t.Parallel()
	q, err := NewQuietHours("", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if q.IsQuiet(time.Now()) {
		t.Fatal("disabled window must never be quiet")
	}
}

func TestNewQuietHours_RejectsBadInput(t *testing.T) {
	t.Parallel()
	cases := []string{"22:00", "22:60-08:00", "24:00-08:00", "abc-08:00", "08:00-08:00"}
	for _, w := range cases {
		w := w
		t.Run(w, func(t *testing.T) {
			t.Parallel()
			if _, err := NewQuietHours(w, "UTC"); err == nil {
				t.Fatalf("expected error for window %q", w)
			}
		})
	}
}

func TestNewQuietHours_RejectsBadTimezone(t *testing.T) {
	t.Parallel()
	if _, err := NewQuietHours("22:00-08:00", "Mars/Olympus"); err == nil {
		t.Fatal("expected error for unknown tz")
	}
}

func TestIsQuiet_NormalWindow(t *testing.T) {
	t.Parallel()
	q, err := NewQuietHours("13:00-17:00", "UTC")
	if err != nil {
		t.Fatal(err)
	}
	utc := time.UTC
	cases := []struct {
		t      time.Time
		expect bool
	}{
		{time.Date(2026, 5, 21, 12, 59, 0, 0, utc), false},
		{time.Date(2026, 5, 21, 13, 0, 0, 0, utc), true},
		{time.Date(2026, 5, 21, 15, 0, 0, 0, utc), true},
		{time.Date(2026, 5, 21, 16, 59, 0, 0, utc), true},
		{time.Date(2026, 5, 21, 17, 0, 0, 0, utc), false},
	}
	for _, c := range cases {
		if got := q.IsQuiet(c.t); got != c.expect {
			t.Errorf("IsQuiet(%v) = %v, want %v", c.t, got, c.expect)
		}
	}
}

func TestIsQuiet_MidnightCrossingWindow(t *testing.T) {
	t.Parallel()
	q, err := NewQuietHours("22:00-08:00", "UTC")
	if err != nil {
		t.Fatal(err)
	}
	utc := time.UTC
	cases := []struct {
		t      time.Time
		expect bool
	}{
		{time.Date(2026, 5, 21, 21, 59, 0, 0, utc), false},
		{time.Date(2026, 5, 21, 22, 0, 0, 0, utc), true},
		{time.Date(2026, 5, 21, 23, 30, 0, 0, utc), true},
		{time.Date(2026, 5, 22, 0, 0, 0, 0, utc), true},
		{time.Date(2026, 5, 22, 7, 59, 0, 0, utc), true},
		{time.Date(2026, 5, 22, 8, 0, 0, 0, utc), false},
		{time.Date(2026, 5, 22, 12, 0, 0, 0, utc), false},
	}
	for _, c := range cases {
		if got := q.IsQuiet(c.t); got != c.expect {
			t.Errorf("IsQuiet(%v) = %v, want %v", c.t, got, c.expect)
		}
	}
}

func TestIsQuiet_RespectsTimezone(t *testing.T) {
	t.Parallel()
	// 22:00 in America/Los_Angeles is 05:00 UTC next day (PDT, UTC-7).
	q, err := NewQuietHours("22:00-08:00", "America/Los_Angeles")
	if err != nil {
		t.Fatal(err)
	}
	utc := time.UTC
	// 05:00 UTC = 22:00 LA prev day → quiet
	if !q.IsQuiet(time.Date(2026, 5, 22, 5, 0, 0, 0, utc)) {
		t.Fatal("expected 05:00 UTC to be quiet in LA tz")
	}
	// 16:00 UTC = 09:00 LA → not quiet
	if q.IsQuiet(time.Date(2026, 5, 22, 16, 0, 0, 0, utc)) {
		t.Fatal("expected 16:00 UTC (09:00 LA) to NOT be quiet")
	}
}

func TestNextAllowed_OutsideWindow_Identity(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	noon := time.Date(2026, 5, 21, 12, 0, 0, 0, time.UTC)
	if got := q.NextAllowed(noon); !got.Equal(noon) {
		t.Fatalf("expected identity, got %v", got)
	}
}

func TestNextAllowed_InsideMidnightCrossingWindow(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	utc := time.UTC

	// 23:30 on 21st → should defer to 08:00 on 22nd.
	from := time.Date(2026, 5, 21, 23, 30, 0, 0, utc)
	want := time.Date(2026, 5, 22, 8, 0, 0, 0, utc)
	if got := q.NextAllowed(from); !got.Equal(want) {
		t.Errorf("from %v: got %v, want %v", from, got, want)
	}

	// 03:00 on 22nd (post-midnight half) → should defer to 08:00 same day.
	from = time.Date(2026, 5, 22, 3, 0, 0, 0, utc)
	want = time.Date(2026, 5, 22, 8, 0, 0, 0, utc)
	if got := q.NextAllowed(from); !got.Equal(want) {
		t.Errorf("from %v: got %v, want %v", from, got, want)
	}
}

func TestNextAllowed_InsideNormalWindow(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("13:00-17:00", "UTC")
	from := time.Date(2026, 5, 21, 14, 0, 0, 0, time.UTC)
	want := time.Date(2026, 5, 21, 17, 0, 0, 0, time.UTC)
	if got := q.NextAllowed(from); !got.Equal(want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestDefer_ZeroScheduledUsesNow(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	now := time.Date(2026, 5, 22, 3, 0, 0, 0, time.UTC) // quiet
	want := time.Date(2026, 5, 22, 8, 0, 0, 0, time.UTC)
	if got := q.Defer(time.Time{}, now); !got.Equal(want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestDefer_ScheduledInsideWindowShifts(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	now := time.Date(2026, 5, 21, 12, 0, 0, 0, time.UTC)
	scheduled := time.Date(2026, 5, 22, 2, 0, 0, 0, time.UTC) // future, but quiet
	want := time.Date(2026, 5, 22, 8, 0, 0, 0, time.UTC)
	if got := q.Defer(scheduled, now); !got.Equal(want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestDefer_ScheduledOutsideWindowPreserved(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	now := time.Date(2026, 5, 21, 12, 0, 0, 0, time.UTC)
	scheduled := time.Date(2026, 5, 21, 18, 0, 0, 0, time.UTC) // not quiet
	if got := q.Defer(scheduled, now); !got.Equal(scheduled) {
		t.Errorf("got %v, want %v", got, scheduled)
	}
}

func TestDefer_DisabledQuietPassthrough(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("", "")
	now := time.Date(2026, 5, 21, 3, 0, 0, 0, time.UTC)
	if got := q.Defer(time.Time{}, now); !got.Equal(now) {
		t.Errorf("got %v, want %v", got, now)
	}
	mustLoadLoc(t, "UTC") // ensure helper compiles
}
