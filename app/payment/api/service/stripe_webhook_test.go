package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pkg/unix"

	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/webhook"
	"go.uber.org/zap"
)

func TestStripeWebhookServiceReturnsNotClaimedWhenSignatureMissing(t *testing.T) {
	t.Parallel()

	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			t.Fatal("markPaidFn should not be called")
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPost, stripeWebhookPath, bytes.NewReader([]byte(`{}`)))
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected status %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestStripeWebhookServiceReturnsNotClaimedOnInvalidSignature(t *testing.T) {
	t.Parallel()

	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			t.Fatal("markPaidFn should not be called")
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPost, stripeWebhookPath, bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Stripe-Signature", "t=0,v1=deadbeef")
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected status %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestStripeWebhookServiceIgnoresUnsupportedEvent(t *testing.T) {
	t.Parallel()

	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			t.Fatal("markPaidFn should not be called")
			return nil
		},
	}

	req := newSignedStripeWebhookRequest(t, svc.webhookSecret, map[string]any{
		"id":   "evt_test",
		"type": "payment_link.created",
		"data": map[string]any{
			"object": map[string]any{
				"id": "plink_test",
			},
		},
	})
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestStripeWebhookServiceMarksPaymentLinkPaid(t *testing.T) {
	t.Parallel()

	var gotPaymentLinkID string
	var gotEventID string
	var gotPaidAt unix.Timestamp
	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			gotPaymentLinkID = paymentLinkID
			gotPaidAt = paidAt
			gotEventID = eventID
			return nil
		},
	}

	const createdUnixSeconds = int64(1_700_000_000)
	req := newSignedStripeWebhookRequest(t, svc.webhookSecret, map[string]any{
		"id":      "evt_completed",
		"type":    stripe.EventTypeCheckoutSessionCompleted,
		"created": createdUnixSeconds,
		"data": map[string]any{
			"object": map[string]any{
				"id":     "cs_test",
				"object": "checkout.session",
				"metadata": map[string]string{
					stripeWebhookMetadataLinkKey: "plink_123",
				},
			},
		},
	})
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
	if gotPaymentLinkID != "plink_123" {
		t.Fatalf("expected payment link id plink_123, got %q", gotPaymentLinkID)
	}
	if gotEventID != "evt_completed" {
		t.Fatalf("expected event id evt_completed, got %q", gotEventID)
	}
	// paid_at is derived from the Stripe event's created time (seconds → ms).
	if got := gotPaidAt.TimestampToInt64(); got != createdUnixSeconds*1000 {
		t.Fatalf("expected paid_at %d ms, got %d", createdUnixSeconds*1000, got)
	}
}

func TestStripeWebhookServiceReturnsOKWhenMetadataMissing(t *testing.T) {
	t.Parallel()

	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			t.Fatal("markPaidFn should not be called")
			return nil
		},
	}

	req := newSignedStripeWebhookRequest(t, svc.webhookSecret, map[string]any{
		"id":   "evt_completed",
		"type": stripe.EventTypeCheckoutSessionCompleted,
		"data": map[string]any{
			"object": map[string]any{
				"id":     "cs_test",
				"object": "checkout.session",
			},
		},
	})
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestStripeWebhookServiceReturnsInternalErrorOnUpdateFailure(t *testing.T) {
	t.Parallel()

	svc := &StripeWebhookService{
		log:           zap.NewNop(),
		webhookSecret: "whsec_test",
		markPaidFn: func(ctx context.Context, paymentLinkID string, paidAt unix.Timestamp, eventID string) error {
			return errors.New("boom")
		},
	}

	req := newSignedStripeWebhookRequest(t, svc.webhookSecret, map[string]any{
		"id":   "evt_completed",
		"type": stripe.EventTypeCheckoutSessionCompleted,
		"data": map[string]any{
			"object": map[string]any{
				"id": "cs_test",
				"metadata": map[string]string{
					stripeWebhookMetadataLinkKey: "plink_123",
				},
			},
		},
	})
	rr := httptest.NewRecorder()

	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rr.Code)
	}
}

func newSignedStripeWebhookRequest(t *testing.T, secret string, payload map[string]any) *http.Request {
	t.Helper()

	if _, ok := payload["object"]; !ok {
		payload["object"] = "event"
	}
	if _, ok := payload["api_version"]; !ok {
		payload["api_version"] = stripe.APIVersion
	}

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	signed := webhook.GenerateTestSignedPayload(&webhook.UnsignedPayload{
		Payload:   body,
		Secret:    secret,
		Timestamp: time.Now(),
	})

	req := httptest.NewRequest(http.MethodPost, stripeWebhookPath, bytes.NewReader(signed.Payload))
	req.Header.Set("Stripe-Signature", signed.Header)

	return req
}
