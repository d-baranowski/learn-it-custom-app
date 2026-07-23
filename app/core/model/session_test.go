package model

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeDateString_StripsSuffix(t *testing.T) {
	assert.Equal(t, "2026-04-06", NormalizeDateString("2026-04-06T00:00:00Z"))
}

func TestNormalizeDateString_NoOpOnClean(t *testing.T) {
	assert.Equal(t, "2026-04-06", NormalizeDateString("2026-04-06"))
}

func TestNormalizeDateString_EmptyString(t *testing.T) {
	assert.Equal(t, "", NormalizeDateString(""))
}

func TestDateTimeToUnixMs_ValidInput(t *testing.T) {
	ms, err := DateTimeToUnixMs("2026-05-27", "10:00", "Europe/Warsaw")
	require.NoError(t, err)

	loc, _ := time.LoadLocation("Europe/Warsaw")
	expected := time.Date(2026, 5, 27, 10, 0, 0, 0, loc).UnixMilli()
	assert.Equal(t, expected, ms)
}

func TestDateTimeToUnixMs_HandlesPostgresSuffix(t *testing.T) {
	ms1, err1 := DateTimeToUnixMs("2026-05-27T00:00:00Z", "10:00", "Europe/Warsaw")
	ms2, err2 := DateTimeToUnixMs("2026-05-27", "10:00", "Europe/Warsaw")
	require.NoError(t, err1)
	require.NoError(t, err2)
	assert.Equal(t, ms2, ms1)
}

func TestDateTimeToUnixMs_InvalidTimezone(t *testing.T) {
	_, err := DateTimeToUnixMs("2026-05-27", "10:00", "Not/A/TZ")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid timezone")
}

func TestDateTimeToUnixMs_InvalidDateFormat(t *testing.T) {
	_, err := DateTimeToUnixMs("27-05-2026", "10:00", "Europe/Warsaw")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid date/time")
}

func TestDateTimeToUnixMs_InvalidTimeFormat(t *testing.T) {
	_, err := DateTimeToUnixMs("2026-05-27", "10:00:00", "Europe/Warsaw")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid date/time")
}

func TestUnixMsToDateTime_RoundTrip(t *testing.T) {
	tz := "Europe/Warsaw"
	originalDate := "2026-05-27"
	originalTime := "14:30"

	ms, err := DateTimeToUnixMs(originalDate, originalTime, tz)
	require.NoError(t, err)

	date, timeStr, err := UnixMsToDateTime(ms, tz)
	require.NoError(t, err)
	assert.Equal(t, originalDate, date)
	assert.Equal(t, originalTime, timeStr)
}

func TestUnixMsToDateTime_DifferentTimezone(t *testing.T) {
	tz := "America/New_York"
	loc, _ := time.LoadLocation(tz)
	ref := time.Date(2026, 1, 15, 9, 30, 0, 0, loc)

	date, timeStr, err := UnixMsToDateTime(ref.UnixMilli(), tz)
	require.NoError(t, err)
	assert.Equal(t, "2026-01-15", date)
	assert.Equal(t, "09:30", timeStr)
}

func TestUnixMsToDateTime_InvalidTimezone(t *testing.T) {
	_, _, err := UnixMsToDateTime(0, "Fake/Zone")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid timezone")
}

func TestGoTimeToDateTimeStr(t *testing.T) {
	loc, _ := time.LoadLocation("Europe/Warsaw")
	ref := time.Date(2026, 12, 31, 23, 59, 0, 0, loc)

	date, timeStr := GoTimeToDateTimeStr(ref)
	assert.Equal(t, "2026-12-31", date)
	assert.Equal(t, "23:59", timeStr)
}

func TestGoTimeToDateTimeStr_Midnight(t *testing.T) {
	ref := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	date, timeStr := GoTimeToDateTimeStr(ref)
	assert.Equal(t, "2026-01-01", date)
	assert.Equal(t, "00:00", timeStr)
}

func TestSession_StartUnixMs(t *testing.T) {
	s := &Session{
		Date:      "2026-05-27",
		StartTime: "10:00",
		Timezone:  "Europe/Warsaw",
	}

	ms, err := s.StartUnixMs()
	require.NoError(t, err)

	loc, _ := time.LoadLocation("Europe/Warsaw")
	expected := time.Date(2026, 5, 27, 10, 0, 0, 0, loc).UnixMilli()
	assert.Equal(t, expected, ms)
}

func TestSession_EndUnixMs(t *testing.T) {
	s := &Session{
		Date:     "2026-05-27",
		EndTime:  "10:50",
		Timezone: "Europe/Warsaw",
	}

	ms, err := s.EndUnixMs()
	require.NoError(t, err)

	loc, _ := time.LoadLocation("Europe/Warsaw")
	expected := time.Date(2026, 5, 27, 10, 50, 0, 0, loc).UnixMilli()
	assert.Equal(t, expected, ms)
}

func TestSession_AutocompleteTemplate(t *testing.T) {
	s := &Session{}
	ac := s.Autocomplete(nil)
	assert.Equal(t, "{{.TherapyLabel}} - {{.Date}} {{.StartTime}}", ac.Template)
}

func TestSession_View_ReturnsSelectFromCoreSession(t *testing.T) {
	s := &Session{}
	q := s.View(nil)
	sql := q.String()
	assert.Contains(t, sql, "core.session")
	assert.Contains(t, sql, "session.*")
	assert.Contains(t, sql, "null::text as payment_link")
	assert.Contains(t, sql, "null::text as payment_status")
	assert.Contains(t, sql, "customer_ids")
	assert.Contains(t, sql, "customer_labels")
}

func TestSession_ViewSQL_ContainsCustomerIdsSubquery(t *testing.T) {
	sql := sessionCustomerIdsExpr()
	assert.Contains(t, sql, "array_agg(sc.customer_id")
	assert.Contains(t, sql, "core.session_customer sc")
	assert.Contains(t, sql, "sc.session_id = session.id")
	assert.Contains(t, sql, "AS customer_ids")
}

func TestSession_ViewSQL_ContainsCustomerLabelsSubquery(t *testing.T) {
	sql := sessionCustomerLabelsExpr()
	assert.Contains(t, sql, "string_agg")
	assert.Contains(t, sql, "c.last_name")
	assert.Contains(t, sql, "c.first_name")
	assert.Contains(t, sql, "core.session_customer sc")
	assert.Contains(t, sql, "c.deleted_at IS NULL")
	assert.Contains(t, sql, "AS customer_labels")
}
