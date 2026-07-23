package model

import (
	"context"
	"fmt"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type SessionFrequencyItem struct {
	Every       int             `json:"every"`                 // This refers to every 'n' weeks or months (depending on Unit)
	OnDay       []int           `json:"onDay"`                 // This refers to the days of the week as defined in protobuf DayOfWeek (1=Monday, 2=Tuesday, ..., 7=Sunday)
	StartTimeMs *unix.Timestamp `json:"startTimeMs,omitempty"` // Milliseconds from midnight (00:00) for when the session should start.
	Unit        int             `json:"unit"`                  // Unit of time: 0=UNSPECIFIED, 1=WEEK, 2=MONTH
	IsOnline    bool            `json:"isOnline"`              // Whether sessions generated from this frequency are online
	RoomId      *string         `json:"roomId,omitempty"`      // Preferred room for sessions generated from this frequency
}

// GetEvery returns the frequency interval
func (s *SessionFrequencyItem) GetEvery() int {
	return s.Every
}

// GetOnDay returns the days of the week
func (s *SessionFrequencyItem) GetOnDay() []int {
	return s.OnDay
}

// GetStartTimeMs returns the start time in milliseconds
func (s *SessionFrequencyItem) GetStartTimeMs() *unix.Timestamp {
	return s.StartTimeMs
}

// GetUnit returns the unit of time
func (s *SessionFrequencyItem) GetUnit() int {
	return s.Unit
}

type SessionFrequency []SessionFrequencyItem

type Therapy struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.therapy,alias:therapy"`

	Id                         string           `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	TherapistId                string           `bun:"therapist_id,notnull" json:"therapistId" rpg:"all,required"`
	TherapistLabel             string           `bun:",scanonly" json:"therapistLabel" rpg:"get,list,search,filter"`
	TherapistAbbreviationLabel *string          `bun:",scanonly" json:"therapistAbbreviationLabel" rpg:"get,list,search,filter"`
	ServiceId                  string           `bun:"service_id,notnull" json:"serviceId" rpg:"all,required"`
	ServiceLabel               string           `bun:",scanonly" json:"serviceLabel" rpg:"get,list,search,filter"`
	DisplayName                string           `bun:"display_name,notnull" json:"displayName" rpg:"all,required"`
	StartDate                  unix.Timestamp   `bun:"start_date,notnull" json:"startDate" rpg:"all"`
	EndDate                    *unix.Timestamp  `bun:"end_date" json:"endDate" rpg:"all"`
	TherapyDayOfWeeks          []int            `bun:",scanonly,array" json:"therapyDayOfWeeks" rpg:"get,list,search,filter"`
	TherapyDaysFirstDaySort    int              `bun:",scanonly" json:"therapyDaysFirstDaySort" rpg:"get,list"`
	TherapyDaysSequenceSort    string           `bun:",scanonly" json:"therapyDaysSequenceSort" rpg:"get,list"`
	SessionPrice               decimal.Decimal  `bun:"session_price,notnull" json:"sessionPrice" rpg:"all"`
	SessionDuration            int              `bun:"session_duration,notnull" json:"sessionDuration" rpg:"all"`
	SessionFrequency           SessionFrequency `bun:"session_frequency,type:jsonb" json:"sessionFrequency" rpg:"all"`
	SessionsGeneratedAt        *unix.Timestamp  `bun:"sessions_generated_at" json:"sessionsGeneratedAt" rpg:"get,list"`
	SessionsGeneratedTill      *unix.Timestamp  `bun:"sessions_generated_till" json:"sessionsGeneratedTill" rpg:"get,list"`
	CustomerIds                []string         `bun:",scanonly,array" json:"customerIds" rpg:"get,list,search,filter"`
	CustomerLabels             *string          `bun:",scanonly" json:"customerLabels" rpg:"get,list,search,filter"`

	Customers []*Customer `bun:"m2m:core.therapy_customer,join:Therapy=Customer" json:"customers,omitempty"`
	Sessions  []*Session  `bun:"rel:has-many,join:id=therapy_id" json:"sessions,omitempty"`

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

func (m *Therapy) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.therapy").
		ColumnExpr("therapy.*").
		ColumnExpr(therapyDayOfWeeksExpr()).
		ColumnExpr(therapyDaysFirstDaySortExpr()).
		ColumnExpr(therapyDaysSequenceSortExpr()).
		ColumnExpr(therapyCustomerIdsExpr()).
		ColumnExpr(therapyCustomerLabelsExpr())
}

func therapyCustomerIdsExpr() string {
	return `(
		SELECT COALESCE(array_agg(tc.customer_id ORDER BY tc.customer_id), ARRAY[]::char(27)[])
		FROM core.therapy_customer tc
		WHERE tc.therapy_id = therapy.id
	) AS customer_ids`
}

func therapyCustomerLabelsExpr() string {
	return `(
		SELECT string_agg(
			TRIM(COALESCE(c.last_name, '') || ' ' || COALESCE(c.first_name, '')),
			', '
			ORDER BY COALESCE(c.last_name, ''), COALESCE(c.first_name, '')
		)
		FROM core.therapy_customer tc
		JOIN core.customer c ON c.id = tc.customer_id AND c.deleted_at IS NULL
		WHERE tc.therapy_id = therapy.id
	) AS customer_labels`
}

func therapyFlattenedDaysSubquery() string {
	return `
		SELECT DISTINCT (day_values.day_of_week)::int AS day_of_week
		FROM jsonb_array_elements(COALESCE(therapy.session_frequency, '[]'::jsonb)) AS frequency(entry)
		CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(frequency.entry->'onDay', '[]'::jsonb)) AS day_values(day_of_week)
		WHERE (day_values.day_of_week)::int BETWEEN 1 AND 7
	`
}

func therapyDayOfWeeksExpr() string {
	return fmt.Sprintf(`(
		SELECT COALESCE(array_agg(day_of_week ORDER BY day_of_week), ARRAY[]::integer[])
		FROM (%s) AS therapy_days
	) AS therapy_day_of_weeks`, therapyFlattenedDaysSubquery())
}

func therapyDaysFirstDaySortExpr() string {
	return fmt.Sprintf(`(
		SELECT COALESCE(MIN(day_of_week), 8)
		FROM (%s) AS therapy_days
	) AS therapy_days_first_day_sort`, therapyFlattenedDaysSubquery())
}

func therapyDaysSequenceSortExpr() string {
	return fmt.Sprintf(`(
		SELECT COALESCE(string_agg(LPAD(day_of_week::text, 2, '0'), '.' ORDER BY day_of_week), '99')
		FROM (%s) AS therapy_days
	) AS therapy_days_sequence_sort`, therapyFlattenedDaysSubquery())
}

func (*Therapy) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}}",
	}
}

func TherapyLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "TherapyLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			return "COALESCE(therapy_label.display_name, '') AS \"therapy_label\""
		},
		Join: "LEFT JOIN core.therapy AS therapy_label ON therapy_label.id = %s.therapy_id",
	})
}
