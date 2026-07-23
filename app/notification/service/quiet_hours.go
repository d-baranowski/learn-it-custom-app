package service

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// QuietHours represents a daily window during which notifications should not
// be dispatched. Both endpoints are evaluated in `loc`. A window where
// startMinutes > endMinutes crosses midnight (e.g. 22:00-08:00).
//
// An empty window (parsed from "") means quiet hours are disabled.
type QuietHours struct {
	enabled      bool
	startMinutes int
	endMinutes   int
	loc          *time.Location
}

func NewQuietHours(window, tz string) (*QuietHours, error) {
	loc := time.UTC
	if t := strings.TrimSpace(tz); t != "" {
		l, err := time.LoadLocation(t)
		if err != nil {
			return nil, fmt.Errorf("invalid timezone %q: %w", t, err)
		}
		loc = l
	}
	w := strings.TrimSpace(window)
	if w == "" {
		return &QuietHours{enabled: false, loc: loc}, nil
	}
	parts := strings.SplitN(w, "-", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("quiet hours window must be HH:MM-HH:MM, got %q", w)
	}
	start, err := parseHM(parts[0])
	if err != nil {
		return nil, fmt.Errorf("quiet hours start: %w", err)
	}
	end, err := parseHM(parts[1])
	if err != nil {
		return nil, fmt.Errorf("quiet hours end: %w", err)
	}
	if start == end {
		return nil, fmt.Errorf("quiet hours start and end must differ")
	}
	return &QuietHours{enabled: true, startMinutes: start, endMinutes: end, loc: loc}, nil
}

func parseHM(s string) (int, error) {
	s = strings.TrimSpace(s)
	parts := strings.SplitN(s, ":", 2)
	if len(parts) != 2 {
		return 0, fmt.Errorf("expected HH:MM, got %q", s)
	}
	h, err := strconv.Atoi(parts[0])
	if err != nil || h < 0 || h > 23 {
		return 0, fmt.Errorf("invalid hour in %q", s)
	}
	m, err := strconv.Atoi(parts[1])
	if err != nil || m < 0 || m > 59 {
		return 0, fmt.Errorf("invalid minute in %q", s)
	}
	return h*60 + m, nil
}

// IsQuiet reports whether the given instant falls inside the quiet window
// in the configured timezone.
func (q *QuietHours) IsQuiet(t time.Time) bool {
	if q == nil || !q.enabled {
		return false
	}
	local := t.In(q.loc)
	cur := local.Hour()*60 + local.Minute()
	if q.startMinutes < q.endMinutes {
		return cur >= q.startMinutes && cur < q.endMinutes
	}
	// Window crosses midnight (e.g. 22:00-08:00).
	return cur >= q.startMinutes || cur < q.endMinutes
}

// NextAllowed returns the earliest instant ≥ t that is outside the quiet
// window. If t is already outside, returns t. The returned time is in the
// configured timezone.
func (q *QuietHours) NextAllowed(t time.Time) time.Time {
	if q == nil || !q.enabled || !q.IsQuiet(t) {
		return t
	}
	local := t.In(q.loc)
	// Build today's end-of-window in local time.
	endHour := q.endMinutes / 60
	endMin := q.endMinutes % 60
	end := time.Date(local.Year(), local.Month(), local.Day(), endHour, endMin, 0, 0, q.loc)
	// If the window crosses midnight and `local` is in the post-midnight half,
	// today's end is the right answer. If `local` is in the pre-midnight half
	// (e.g. 23:00 with a 22-08 window), end-of-window is tomorrow.
	if q.startMinutes > q.endMinutes {
		curMin := local.Hour()*60 + local.Minute()
		if curMin >= q.startMinutes {
			end = end.AddDate(0, 0, 1)
		}
	}
	return end
}

// Defer returns the time the notification should be dispatched. It is the
// later of `scheduled` and `NextAllowed(scheduled or now)`. Pass a zero
// `scheduled` for "send as soon as allowed".
func (q *QuietHours) Defer(scheduled, now time.Time) time.Time {
	target := scheduled
	if target.IsZero() || target.Before(now) {
		target = now
	}
	return q.NextAllowed(target)
}
