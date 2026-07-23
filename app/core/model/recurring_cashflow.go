package model

import (
	"context"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type RecurringCashflowFrequencyItem struct {
	Every       int             `json:"every"`                 // This refers to every 'n' weeks or months (depending on Unit)
	OnDay       []int           `json:"onDay"`                 // This refers to the days of the week as defined in protobuf DayOfWeek (1=Monday, 2=Tuesday, ..., 7=Sunday)
	StartTimeMs *unix.Timestamp `json:"startTimeMs,omitempty"` // Milliseconds from midnight (00:00) for when the cashflow should start.
	Unit        int             `json:"unit"`                  // Unit of time: 0=UNSPECIFIED, 1=WEEK, 2=MONTH
}

// GetEvery returns the frequency interval
func (r *RecurringCashflowFrequencyItem) GetEvery() int {
	return r.Every
}

// GetOnDay returns the days of the week
func (r *RecurringCashflowFrequencyItem) GetOnDay() []int {
	return r.OnDay
}

// GetStartTimeMs returns the start time in milliseconds
func (r *RecurringCashflowFrequencyItem) GetStartTimeMs() *unix.Timestamp {
	return r.StartTimeMs
}

// GetUnit returns the unit of time
func (r *RecurringCashflowFrequencyItem) GetUnit() int {
	return r.Unit
}

type RecurringCashflowFrequency []RecurringCashflowFrequencyItem

type RecurringCashflow struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.recurring_cashflow,alias:recurring_cashflow"`

	Id          string                     `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	DisplayName string                     `bun:"display_name,notnull" json:"displayName" rpg:"all,required"`
	Amount      decimal.Decimal            `bun:"amount,notnull" json:"amount" rpg:"all,required"`
	StartDate   unix.Timestamp             `bun:"start_date,notnull" json:"startDate" rpg:"all"`
	EndDate     *unix.Timestamp            `bun:"end_date" json:"endDate" rpg:"all"`
	Frequency   RecurringCashflowFrequency `bun:"frequency,type:jsonb" json:"frequency" rpg:"all"`

	Transactions []*Transaction `bun:"rel:has-many,join:id=recurring_cashflow_id" json:"transactions,omitempty"`

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

func (m *RecurringCashflow) View(_ context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.recurring_cashflow").
		ColumnExpr("recurring_cashflow.*")
}

func (*RecurringCashflow) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}}",
	}
}

func RecurringCashflowLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "RecurringCashflowLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			return "COALESCE(recurring_cashflow_label.display_name, '') AS \"recurring_cashflow_label\""
		},
		Join: "LEFT JOIN core.recurring_cashflow AS recurring_cashflow_label ON recurring_cashflow_label.id = %s.recurring_cashflow_id",
	})
}
