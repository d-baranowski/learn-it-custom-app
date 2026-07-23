package model

import (
	"context"
	"fmt"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"
	"strings"
	"time"

	"github.com/uptrace/bun"
)

type Session struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.session,alias:session"`

	Id                         string          `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapyId                  *string         `bun:"therapy_id" json:"therapyId" rpg:"all"`
	TherapyLabel               string          `bun:",scanonly" json:"therapyLabel" rpg:"get,list,search,filter"`
	TherapistId                string          `bun:"therapist_id,notnull" json:"therapistId" rpg:"all,required"`
	TherapistLabel             string          `bun:",scanonly" json:"therapistLabel" rpg:"get,list,search,filter"`
	TherapistAbbreviationLabel *string         `bun:",scanonly" json:"therapistAbbreviationLabel" rpg:"get,list,search,filter"`
	RoomId                     *string         `bun:"room_id" json:"roomId" rpg:"all"`
	RoomLabel                  *string         `bun:",scanonly" json:"roomLabel" rpg:"get,list,search,filter"`
	Date                       string          `bun:"date,notnull" json:"date" rpg:"all"`
	StartTime                  string          `bun:"start_time,notnull" json:"startTime" rpg:"all"`
	EndTime                    string          `bun:"end_time,notnull" json:"endTime" rpg:"all"`
	Timezone                   string          `bun:"timezone,notnull,default:'Europe/Warsaw'" json:"timezone" rpg:"all"`
	Price                      decimal.Decimal `bun:"price,notnull" json:"price" rpg:"all"`
	PaymentLinkId              *string         `bun:"payment_link_id" json:"paymentLinkId" rpg:"all"`
	PaymentLink                *string         `bun:",scanonly" json:"paymentLink"`
	PaymentStatus              *string         `bun:",scanonly" json:"paymentStatus"`
	PaidAt                     *unix.Timestamp `bun:"paid_at" json:"paidAt" rpg:"all"`
	PaymentType                *int            `bun:"payment_type" json:"paymentType" rpg:"all"`
	CancelledAt                *unix.Timestamp `bun:"cancelled_at" json:"cancelledAt" rpg:"all"`
	CancellationReason         *string         `bun:"cancellation_reason" json:"cancellationReason" rpg:"all"`
	CancellationActor          *int            `bun:"cancellation_actor" json:"cancellationActor" rpg:"all"`
	CancelledByUserId          *string         `bun:"cancelled_by_user_id" json:"cancelledByUserId" rpg:"get"`
	CancelledByUserLabel       *string         `bun:",scanonly" json:"cancelledByUserLabel" rpg:"get"`
	TherapySessionFrequencyRef *string         `bun:"therapy_session_frequency_ref" json:"therapySessionFrequencyRef" rpg:"get"`
	IsOnline                   *bool           `bun:"is_online" json:"isOnline" rpg:"all"`
	DisplayName                *string         `bun:"display_name" json:"displayName" rpg:"all"`
	CustomerIds                []string        `bun:",scanonly,array" json:"customerIds" rpg:"get,list,search,filter"`
	CustomerLabels             *string         `bun:",scanonly" json:"customerLabels" rpg:"get,list,search,filter"`

	Customers []*Customer `bun:"m2m:core.session_customer,join:Session=Customer" json:"customers,omitempty"`
	Therapy   *Therapy    `bun:"rel:belongs-to,join:therapy_id=id" json:"therapy,omitempty"`
	Room      *Room       `bun:"rel:belongs-to,join:room_id=id" json:"room,omitempty"`
	Therapist *Therapist  `bun:"rel:belongs-to,join:therapist_id=id" json:"therapist,omitempty"`

	CreatedAt          unix.Timestamp  `json:"createdAt"`
	CreatedAtDateLabel string          `bun:",scanonly" json:"createdAtDateLabel"`
	CreatedBy          string          `json:"createdBy"`
	CreatedByLabel     string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt          *unix.Timestamp `json:"updatedAt"`
	UpdatedAtDateLabel string          `bun:",scanonly" json:"updatedAtDateLabel"`
	UpdatedBy          *string         `json:"updatedBy"`
	UpdatedByLabel     *string         `bun:",scanonly" json:"updatedByLabel"`
	DeletedAt          *unix.Timestamp `json:"deletedAt"`
	DeletedAtDateLabel string          `bun:",scanonly" json:"deletedAtDateLabel"`
	DeletedBy          *string         `json:"deletedBy"`
	DeletedByLabel     *string         `bun:",scanonly" json:"deletedByLabel"`
}

func (m *Session) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.session").
		ColumnExpr("session.*").
		ColumnExpr("null::text as payment_link").
		ColumnExpr("null::text as payment_status").
		ColumnExpr(sessionCustomerIdsExpr()).
		ColumnExpr(sessionCustomerLabelsExpr())
}

func sessionCustomerIdsExpr() string {
	return `(
		SELECT COALESCE(array_agg(sc.customer_id ORDER BY sc.customer_id), ARRAY[]::char(27)[])
		FROM core.session_customer sc
		WHERE sc.session_id = session.id
	) AS customer_ids`
}

func sessionCustomerLabelsExpr() string {
	return `(
		SELECT string_agg(
			TRIM(COALESCE(c.last_name, '') || ' ' || COALESCE(c.first_name, '')),
			', '
			ORDER BY COALESCE(c.last_name, ''), COALESCE(c.first_name, '')
		)
		FROM core.session_customer sc
		JOIN core.customer c ON c.id = sc.customer_id AND c.deleted_at IS NULL
		WHERE sc.session_id = session.id
	) AS customer_labels`
}

func (*Session) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.TherapyLabel}} - {{.Date}} {{.StartTime}}",
	}
}

func SessionLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "SessionLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			return "COALESCE(session_therapy_label.display_name, '') || ' - ' || session_label.date || ' ' || session_label.start_time AS \"session_label\""
		},
		Join: "LEFT JOIN core.session AS session_label ON session_label.id = %s.session_id " +
			"LEFT JOIN core.therapy AS session_therapy_label ON session_therapy_label.id = session_label.therapy_id",
	})
}

// CancelledByUserLabel resolves the cancellation user's display name. Only
// models that have a cancelled_by_user_id column (currently just Session) gain
// the JOIN — the auto-labeler walks struct fields, so other models are
// untouched.
func CancelledByUserLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "CancelledByUserLabel", repository.LabelerConfigEntry{
		Column: "cancelled_by_user_label.display_name as cancelled_by_user_label",
		Join:   `LEFT JOIN core."user" AS cancelled_by_user_label ON cancelled_by_user_label.id = %s.cancelled_by_user_id`,
	})
}

// StartUnixMs converts the session's Date + StartTime + Timezone to Unix milliseconds.
func (m *Session) StartUnixMs() (int64, error) {
	return DateTimeToUnixMs(m.Date, m.StartTime, m.Timezone)
}

// EndUnixMs converts the session's Date + EndTime + Timezone to Unix milliseconds.
func (m *Session) EndUnixMs() (int64, error) {
	return DateTimeToUnixMs(m.Date, m.EndTime, m.Timezone)
}

// NormalizeDateString strips any "T..." suffix from a date string.
// PostgreSQL DATE columns scanned into Go strings via bun return "2026-04-06T00:00:00Z"
// instead of just "2026-04-06". This helper normalises to YYYY-MM-DD.
func NormalizeDateString(date string) string {
	if idx := strings.IndexByte(date, 'T'); idx > 0 {
		return date[:idx]
	}
	return date
}

// DateTimeToUnixMs converts date (YYYY-MM-DD), time (HH:MM), and timezone to Unix milliseconds.
// The date may come from PostgreSQL DATE column as "2026-04-06T00:00:00Z"; we strip the T... suffix.
func DateTimeToUnixMs(date, timeStr, tz string) (int64, error) {
	date = NormalizeDateString(date)
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return 0, fmt.Errorf("invalid timezone %q: %w", tz, err)
	}
	t, err := time.ParseInLocation("2006-01-02 15:04", date+" "+timeStr, loc)
	if err != nil {
		return 0, fmt.Errorf("invalid date/time %q %q: %w", date, timeStr, err)
	}
	return t.UnixMilli(), nil
}

// UnixMsToDateTime converts Unix milliseconds to (date, time, timezone) strings in the given timezone.
func UnixMsToDateTime(ms int64, tz string) (date string, timeStr string, err error) {
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return "", "", fmt.Errorf("invalid timezone %q: %w", tz, err)
	}
	t := time.UnixMilli(ms).In(loc)
	return t.Format("2006-01-02"), t.Format("15:04"), nil
}

// GoTimeToDateTimeStr converts a Go time.Time to (date, timeStr) strings using the time's location.
func GoTimeToDateTimeStr(t time.Time) (date string, timeStr string) {
	return t.Format("2006-01-02"), t.Format("15:04")
}
