package service

import (
	"testing"
	"time"
)

func TestComputeFireAt(t *testing.T) {
	leadTime := int64(86400000) // 24 hours

	fireAt, err := computeFireAt("2026-07-15", "10:00", "Europe/Warsaw", leadTime)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	loc, _ := time.LoadLocation("Europe/Warsaw")
	sessionTime, _ := time.ParseInLocation("2006-01-02 15:04", "2026-07-15 10:00", loc)
	expectedFireAt := sessionTime.UnixMilli() - leadTime

	if fireAt != expectedFireAt {
		t.Errorf("fireAt = %d, want %d (diff = %dms)", fireAt, expectedFireAt, fireAt-expectedFireAt)
	}
}

func TestComputeFireAtWithSeconds(t *testing.T) {
	fireAt, err := computeFireAt("2026-07-15", "10:00:30", "UTC", 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected, _ := time.Parse("2006-01-02 15:04:05", "2026-07-15 10:00:30")
	if fireAt != expected.UnixMilli() {
		t.Errorf("fireAt = %d, want %d", fireAt, expected.UnixMilli())
	}
}

func TestComputeFireAtBadTimezone(t *testing.T) {
	fireAt, err := computeFireAt("2026-07-15", "10:00", "Invalid/Zone", 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected, _ := time.Parse("2006-01-02 15:04", "2026-07-15 10:00")
	if fireAt != expected.UnixMilli() {
		t.Errorf("fireAt = %d, want %d (should fall back to UTC)", fireAt, expected.UnixMilli())
	}
}

func TestComputeFireAtBadDate(t *testing.T) {
	_, err := computeFireAt("not-a-date", "10:00", "UTC", 0)
	if err == nil {
		t.Error("expected error for invalid date")
	}
}
