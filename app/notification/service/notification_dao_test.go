package service

import (
	"testing"
	"time"

	notificationv1 "app/notification/gen/notification/v1"
)

func ptr(v int64) *int64 { return &v }

func TestScheduleState_NoScheduleNoQuiet(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("", "")
	d := &bunNotificationDAO{quietHours: q}
	status, next, scheduled := d.scheduleState(nil)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED {
		t.Errorf("status: want CREATED, got %d", status)
	}
	if next != nil {
		t.Errorf("next_attempt_at: want nil, got %v", next)
	}
	if scheduled != nil {
		t.Errorf("scheduled_at: want nil, got %v", scheduled)
	}
}

func TestScheduleState_FutureScheduleDefers(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("", "")
	d := &bunNotificationDAO{quietHours: q}
	future := time.Now().Add(2 * time.Hour).UnixMilli()
	status, next, scheduled := d.scheduleState(&future)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_WAITING {
		t.Errorf("status: want WAITING, got %d", status)
	}
	if next == nil || next.Int64() != future {
		t.Errorf("next_attempt_at: want %d, got %v", future, next)
	}
	if scheduled == nil || scheduled.Int64() != future {
		t.Errorf("scheduled_at: want %d, got %v", future, scheduled)
	}
}

func TestScheduleState_PastScheduleNoDefer(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("", "")
	d := &bunNotificationDAO{quietHours: q}
	past := time.Now().Add(-1 * time.Hour).UnixMilli()
	status, next, scheduled := d.scheduleState(&past)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED {
		t.Errorf("status: want CREATED, got %d", status)
	}
	if next != nil {
		t.Errorf("next_attempt_at: want nil, got %v", next)
	}
	// scheduled_at is preserved even when in the past (audit).
	if scheduled == nil || scheduled.Int64() != past {
		t.Errorf("scheduled_at: want %d preserved, got %v", past, scheduled)
	}
}

func TestScheduleState_QuietHoursNowDefersToWindowEnd(t *testing.T) {
	t.Parallel()
	// Configure window to cover all hours so any "now" is quiet.
	q, _ := NewQuietHours("00:00-23:59", "UTC")
	d := &bunNotificationDAO{quietHours: q}
	status, next, _ := d.scheduleState(nil)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_WAITING {
		t.Errorf("status: want WAITING, got %d", status)
	}
	if next == nil || next.Int64() <= time.Now().UnixMilli() {
		t.Errorf("next_attempt_at must be in future when quiet, got %v", next)
	}
}

func TestScheduleState_QuietHoursAndFutureScheduleTakesLater(t *testing.T) {
	t.Parallel()
	// Window 22:00-08:00 UTC. Pick a schedule at 03:00 UTC (inside quiet);
	// next allowed is 08:00 same day.
	q, _ := NewQuietHours("22:00-08:00", "UTC")
	d := &bunNotificationDAO{quietHours: q}
	scheduled := time.Date(2099, 1, 2, 3, 0, 0, 0, time.UTC).UnixMilli()
	want := time.Date(2099, 1, 2, 8, 0, 0, 0, time.UTC).UnixMilli()
	status, next, _ := d.scheduleState(&scheduled)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_WAITING {
		t.Errorf("status: want WAITING, got %d", status)
	}
	if next == nil || next.Int64() != want {
		t.Errorf("next_attempt_at: want %d, got %v", want, next)
	}
}

func TestScheduleState_ZeroScheduledIsTreatedAsNoSchedule(t *testing.T) {
	t.Parallel()
	q, _ := NewQuietHours("", "")
	d := &bunNotificationDAO{quietHours: q}
	zero := int64(0)
	status, next, scheduled := d.scheduleState(&zero)
	if status != notificationv1.NotificationStatus_NOTIFICATION_STATUS_CREATED {
		t.Errorf("status: want CREATED for zero, got %d", status)
	}
	if next != nil {
		t.Errorf("next_attempt_at: want nil for zero, got %v", next)
	}
	if scheduled != nil {
		t.Errorf("scheduled_at: want nil for zero, got %v", scheduled)
	}
	_ = ptr // keep helper referenced
}
