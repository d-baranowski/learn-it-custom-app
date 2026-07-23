package service

import (
	"context"
	"encoding/json"
	"testing"

	paymentevents "app/payment/events"
	"pkg/pgmq"

	"go.uber.org/zap"
)

// The DB UPDATE path is exercised end-to-end against the stack; here we cover
// the guard branches that must short-circuit before any DB access (nil db).
func TestPaymentReceivedHandler_EmptyPaymentLinkIDIsNoop(t *testing.T) {
	reg := pgmq.NewRegistry()
	RegisterEventHandlers(reg, nil, zap.NewNop())

	h, ok := reg.Get(paymentevents.PaymentReceived)
	if !ok {
		t.Fatal("payment.received handler not registered")
	}

	payload, _ := json.Marshal(paymentevents.PaymentReceivedPayload{PaymentLinkID: "", PaidAt: 123})
	if err := h(context.Background(), payload); err != nil {
		t.Fatalf("expected no-op nil error for empty payment_link_id, got %v", err)
	}
}

func TestPaymentReceivedHandler_InvalidJSONReturnsError(t *testing.T) {
	reg := pgmq.NewRegistry()
	RegisterEventHandlers(reg, nil, zap.NewNop())

	h, _ := reg.Get(paymentevents.PaymentReceived)
	if err := h(context.Background(), json.RawMessage(`{bad`)); err == nil {
		t.Fatal("expected error on invalid json payload")
	}
}
