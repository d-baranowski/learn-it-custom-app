package model

import (
	"context"
	"pkg/decimal"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

const (
	PaymentLinkProviderStripe = "stripe"

	PaymentLinkStatusPending = "PENDING"
	PaymentLinkStatusReady   = "READY"
	PaymentLinkStatusFailed  = "FAILED"
	PaymentLinkStatusPaid    = "PAID"
)

type PaymentLink struct {
	bun.BaseModel `bun:"table:payment.payment_link,alias:payment_link"`

	Id                string          `bun:"id,pk,nullzero" json:"id"`
	Provider          string          `bun:"provider,notnull" json:"provider"`
	Status            string          `bun:"status,notnull" json:"status"`
	Url               *string         `bun:"url" json:"url"`
	ErrorMessage      *string         `bun:"error_message" json:"errorMessage"`
	Amount            decimal.Decimal `bun:"amount,notnull" json:"amount"`
	Currency          string          `bun:"currency,notnull" json:"currency"`
	Description       string          `bun:"description,notnull" json:"description"`
	ProviderReference *string         `bun:"provider_reference" json:"providerReference"`
	AttemptCount      int             `bun:"attempt_count,notnull" json:"attemptCount"`
	LastAttemptAt     *unix.Timestamp `bun:"last_attempt_at" json:"lastAttemptAt"`
	NextAttemptAt     *unix.Timestamp `bun:"next_attempt_at" json:"nextAttemptAt"`

	CreatedAt unix.Timestamp  `json:"createdAt"`
	CreatedBy string          `json:"createdBy"`
	UpdatedAt *unix.Timestamp `json:"updatedAt"`
	UpdatedBy *string         `json:"updatedBy"`
	DeletedAt *unix.Timestamp `json:"deletedAt"`
	DeletedBy *string         `json:"deletedBy"`
}

func (m *PaymentLink) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("payment.payment_link").
		ColumnExpr("payment_link.*")
}
