package events

const PaymentReceived = "payment.received"

type PaymentReceivedPayload struct {
	PaymentLinkID string `json:"payment_link_id"`
	PaidAt        int64  `json:"paid_at"` // unix ms — actual Stripe payment time
}
