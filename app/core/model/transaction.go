package model

import (
	"context"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Transaction struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.transaction,alias:transaction"`

	Id                            string          `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	RecurringCashflowId           *string         `bun:"recurring_cashflow_id" json:"recurringCashflowId" rpg:"all"`
	RecurringCashflowLabel        *string         `bun:",scanonly" json:"recurringCashflowLabel" rpg:"get,list,search,filter"`
	DisplayName                   string          `bun:"display_name,notnull" json:"displayName" rpg:"all,required"`
	Amount                        decimal.Decimal `bun:"amount,notnull" json:"amount" rpg:"all,required"`
	IncurredAt                    unix.Timestamp  `bun:"incurred_at,notnull" json:"incurredAt" rpg:"all,required"`
	RecurringCashflowFrequencyRef *string         `bun:"recurring_cashflow_frequency_ref" json:"recurringCashflowFrequencyRef" rpg:"get"`

	RecurringCashflow *RecurringCashflow `bun:"rel:belongs-to,join:recurring_cashflow_id=id" json:"recurringCashflow,omitempty"`

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

func (m *Transaction) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.transaction").
		ColumnExpr("transaction.*")
}

func (*Transaction) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.DisplayName}} - {{.IncurredAt}}",
	}
}

func TransactionLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "TransactionLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			return "COALESCE(transaction_label.display_name, '') || ' - ' || transaction_label.incurred_at::text AS \"transaction_label\""
		},
		Join: "LEFT JOIN core.transaction AS transaction_label ON transaction_label.id = %s.transaction_id",
	})
}
