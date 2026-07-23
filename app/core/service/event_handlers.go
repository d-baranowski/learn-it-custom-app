package service

import (
	"context"
	"encoding/json"
	"fmt"

	"app/core/model"
	paymentevents "app/payment/events"
	"pkg/pgmq"
	"pkg/unix"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

const paymentReceivedUpdatedBy = "payment-received-consumer"

func EventHandlerRegistryProvider(db *bun.DB, log *zap.Logger) *pgmq.Registry {
	registry := pgmq.NewRegistry()
	RegisterEventHandlers(registry, db, log)
	return registry
}

// RegisterEventHandlers wires core's consumers. payment.received is a payment
// integration event; core reacts by stamping paid_at on its own session row.
// The resulting NULL→non-NULL transition is what core-event turns into the
// session.paid domain event — core never publishes anything itself.
func RegisterEventHandlers(registry *pgmq.Registry, db *bun.DB, log *zap.Logger) {
	hlog := log.Named("event-handlers")

	registry.Register(paymentevents.PaymentReceived, func(ctx context.Context, payload json.RawMessage) error {
		var p paymentevents.PaymentReceivedPayload
		if err := json.Unmarshal(payload, &p); err != nil {
			return err
		}

		if p.PaymentLinkID == "" {
			hlog.Warn("payment.received without payment_link_id")
			return nil
		}

		now := unix.Now()
		res, err := db.NewUpdate().
			Model((*model.Session)(nil)).
			Set("paid_at = ?", unix.Int64ToTimestamp(p.PaidAt)).
			Set("updated_at = ?", now).
			Set("updated_by = ?", paymentReceivedUpdatedBy).
			Where("payment_link_id = ?", p.PaymentLinkID).
			Where("deleted_at IS NULL").
			Where("paid_at IS NULL"). // idempotent; never clobber an earlier payment time
			Exec(ctx)
		if err != nil {
			return fmt.Errorf("set paid_at for payment link %s: %w", p.PaymentLinkID, err)
		}

		if n, _ := res.RowsAffected(); n == 0 {
			hlog.Info("payment.received: no session updated (already paid or not found)",
				zap.String("payment_link_id", p.PaymentLinkID))
			return nil
		}

		hlog.Info("session marked paid", zap.String("payment_link_id", p.PaymentLinkID))
		return nil
	})
}
