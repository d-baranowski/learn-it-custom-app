package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	paymentevents "app/payment/events"
	"app/payment/model"
	"pkg/pgmq"
	"pkg/unix"

	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/webhook"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

const (
	stripeWebhookPath            = "/internal/webhook"
	stripeWebhookUpdatedBy       = "stripe-webhook"
	stripeWebhookMetadataLinkKey = "payment_link_id"
	webhookNotClaimedStatus      = 422
)

type StripeWebhookService struct {
	db             *bun.DB
	log            *zap.Logger
	webhookSecret  string
	eventPublisher pgmq.Publisher
	markPaidFn     func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error
}

func StripeWebhookServiceProvider(props ApiServiceProps) error {
	s := &StripeWebhookService{
		db:             props.DB,
		log:            props.Log.Named("stripe-webhook"),
		webhookSecret:  strings.TrimSpace(props.StripeConfig.WebhookSecret),
		eventPublisher: props.EventPublisher,
	}
	s.markPaidFn = s.markPaymentLinkPaid

	props.ApiServer.AddHandler(stripeWebhookPath, s)

	return nil
}

func (s *StripeWebhookService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if strings.TrimSpace(r.Header.Get("Stripe-Signature")) == "" {
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}

	if s.webhookSecret == "" {
		s.log.Error("stripe webhook secret is not configured")
		http.Error(w, "webhook secret not configured", http.StatusInternalServerError)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		s.log.Error("failed to read webhook payload", zap.Error(err))
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), s.webhookSecret)
	if err != nil {
		// Signature mismatch — could be tampered OR signed by a different
		// Stripe endpoint sharing the public webhook URL. Either way: not ours.
		s.log.Warn("stripe signature verification failed; not claiming", zap.Error(err))
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}

	if event.Type != stripe.EventTypeCheckoutSessionCompleted {
		w.WriteHeader(http.StatusOK)
		return
	}

	var session stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		s.log.Error("failed to decode checkout session", zap.Error(err), zap.String("event_id", event.ID))
		http.Error(w, "invalid event payload", http.StatusBadRequest)
		return
	}

	paymentLinkID := strings.TrimSpace(session.Metadata[stripeWebhookMetadataLinkKey])
	if paymentLinkID == "" {
		s.log.Error("checkout session missing payment_link_id metadata", zap.String("event_id", event.ID), zap.String("checkout_session_id", session.ID))
		w.WriteHeader(http.StatusOK)
		return
	}

	// event.Created is the unix-seconds time Stripe recorded the completion —
	// the actual payment time, not when we happen to process the webhook.
	paidAt := unix.GoTimeToTimestamp(time.Unix(event.Created, 0))

	if err := s.markPaidFn(r.Context(), paymentLinkID, paidAt, event.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.log.Warn("payment link not found for stripe webhook", zap.String("payment_link_id", paymentLinkID), zap.String("event_id", event.ID))
			w.WriteHeader(http.StatusOK)
			return
		}

		s.log.Error("failed to update payment link from stripe webhook", zap.Error(err), zap.String("payment_link_id", paymentLinkID), zap.String("event_id", event.ID))
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *StripeWebhookService) markPaymentLinkPaid(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
	return s.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		var row model.PaymentLink
		if err := tx.NewSelect().
			Model(&row).
			Where("id = ?", paymentLinkID).
			Where("deleted_at is null").
			Limit(1).
			For("UPDATE").
			Scan(ctx); err != nil {
			return err
		}

		if row.Status == model.PaymentLinkStatusPaid {
			s.log.Info("payment link already marked paid", zap.String("payment_link_id", paymentLinkID), zap.String("event_id", eventID))
			return nil
		}

		now := unix.Now()
		row.Status = model.PaymentLinkStatusPaid
		row.ErrorMessage = nil
		row.UpdatedAt = &now
		row.UpdatedBy = stripe.String(stripeWebhookUpdatedBy)

		_, err := tx.NewUpdate().
			Model(&row).
			Column("status", "error_message", "updated_at", "updated_by").
			WherePK().
			Exec(ctx)
		if err != nil {
			return err
		}

		// Publish the integration event only. core consumes payment.received and
		// stamps core.session.paid_at itself — payment never touches core's schema.
		if s.eventPublisher != nil {
			if pubErr := s.eventPublisher.SendTopic(ctx, tx, paymentevents.PaymentReceived, paymentevents.PaymentReceivedPayload{
				PaymentLinkID: paymentLinkID,
				PaidAt:        paidAt.TimestampToInt64(),
			}); pubErr != nil {
				s.log.Error("failed to publish payment.received event", zap.String("payment_link_id", paymentLinkID), zap.Error(pubErr))
			}
		}

		return nil
	})
}
