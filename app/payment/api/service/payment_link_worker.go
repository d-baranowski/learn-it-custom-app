package service

import (
	"app/payment/config"
	"app/payment/model"
	"context"
	"database/sql"
	"sync"
	"time"

	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/paymentlink"
	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/decimal"
	"pkg/unix"
)

var paymentLinkWorkerTracer = otel.Tracer("app/payment/service/payment-link-worker")

var paymentLinkRetryDelays = []time.Duration{
	5 * time.Second,
	10 * time.Second,
	30 * time.Second,
}

type paymentLinkWorker struct {
	db           *bun.DB
	log          *zap.Logger
	stripeConfig *config.StripeConfig

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func PaymentLinkWorkerProvider(lc fx.Lifecycle, props ApiServiceProps) error {
	worker := &paymentLinkWorker{
		db:           props.DB,
		log:          props.Log.Named("payment-link-worker"),
		stripeConfig: props.StripeConfig,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			worker.start(ctx)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return worker.stop(ctx)
		},
	})

	return nil
}

func (w *paymentLinkWorker) start(ctx context.Context) {
	runCtx, cancel := context.WithCancel(ctx)
	w.cancel = cancel
	w.wg.Add(1)

	go func() {
		defer w.wg.Done()

		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		for {
			if err := w.processNext(runCtx); err != nil && err != context.Canceled {
				w.log.Error("failed to process payment link", zap.Error(err))
			}

			select {
			case <-runCtx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (w *paymentLinkWorker) stop(ctx context.Context) error {
	if w.cancel != nil {
		w.cancel()
	}

	done := make(chan struct{})
	go func() {
		defer close(done)
		w.wg.Wait()
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-done:
		return nil
	}
}

func (w *paymentLinkWorker) processNext(ctx context.Context) error {
	ctx, span := paymentLinkWorkerTracer.Start(ctx, "paymentLinkWorker.processNext",
		trace.WithSpanKind(trace.SpanKindInternal))
	defer span.End()

	return w.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		var row model.PaymentLink
		err := tx.NewSelect().
			Model(&row).
			Where("status = ?", model.PaymentLinkStatusPending).
			Where("deleted_at is null").
			Where("next_attempt_at is null or next_attempt_at <= ?", unix.NowInt64()).
			OrderExpr("created_at asc").
			Limit(1).
			For("UPDATE SKIP LOCKED").
			Scan(ctx)
		if err != nil {
			if err == sql.ErrNoRows {
				span.SetAttributes(attribute.Bool("payment_link.found", false))
				return nil
			}
			span.RecordError(err)
			return err
		}
		span.SetAttributes(
			attribute.Bool("payment_link.found", true),
			attribute.String("payment_link.id", row.Id),
		)

		now := unix.Now()
		row.LastAttemptAt = &now
		row.AttemptCount++
		updatedBy := "system"
		row.UpdatedAt = &now
		row.UpdatedBy = &updatedBy

		url, providerReference, err := w.createStripePaymentLink(&row)
		if err == nil {
			row.Status = model.PaymentLinkStatusReady
			row.Url = &url
			row.ProviderReference = providerReference
			row.ErrorMessage = nil
			row.NextAttemptAt = nil

			_, err = tx.NewUpdate().
				Model(&row).
				Column("status", "url", "provider_reference", "error_message", "attempt_count", "last_attempt_at", "next_attempt_at", "updated_at", "updated_by").
				WherePK().
				Exec(ctx)
			return err
		}

		message := err.Error()
		row.ErrorMessage = &message
		if row.AttemptCount > len(paymentLinkRetryDelays) {
			row.Status = model.PaymentLinkStatusFailed
			row.NextAttemptAt = nil
		} else {
			nextAttemptAt := now.AddDuration(paymentLinkRetryDelays[row.AttemptCount-1])
			row.Status = model.PaymentLinkStatusPending
			row.NextAttemptAt = &nextAttemptAt
		}

		_, updateErr := tx.NewUpdate().
			Model(&row).
			Column("status", "error_message", "attempt_count", "last_attempt_at", "next_attempt_at", "updated_at", "updated_by").
			WherePK().
			Exec(ctx)
		return updateErr
	})
}

// toStripeMinorUnits converts a major-unit amount (PLN, stored as a decimal)
// into the integer minor-unit amount (grosze) Stripe expects, rounding to
// whole grosze.
func toStripeMinorUnits(amount decimal.Decimal) int64 {
	return amount.Shift(2).Round(0).IntPart()
}

func (w *paymentLinkWorker) createStripePaymentLink(row *model.PaymentLink) (string, *string, error) {
	stripe.Key = w.stripeConfig.SecretKey

	paymentLinkParams := &stripe.PaymentLinkParams{
		LineItems: []*stripe.PaymentLinkLineItemParams{
			{
				PriceData: &stripe.PaymentLinkLineItemPriceDataParams{
					Currency: stripe.String(row.Currency),
					ProductData: &stripe.PaymentLinkLineItemPriceDataProductDataParams{
						Name: stripe.String(row.Description),
					},
					UnitAmount: stripe.Int64(toStripeMinorUnits(row.Amount)),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Metadata: map[string]string{
			"payment_link_id": row.Id,
		},
	}

	pl, err := paymentlink.New(paymentLinkParams)
	if err != nil {
		return "", nil, err
	}

	providerReference := pl.ID
	return pl.URL, &providerReference, nil
}
