package events

const (
	SessionCreated   = "session.created"
	SessionUpdated   = "session.updated"
	SessionCancelled = "session.cancelled"
	SessionPaid      = "session.paid"
)

type SessionEventPayload struct {
	SessionID       string   `json:"session_id"`
	TherapyID       string   `json:"therapy_id"`
	TherapistID     string   `json:"therapist_id"`
	TherapistUserID string   `json:"therapist_user_id"`
	Date            string   `json:"date"`
	StartTime       string   `json:"start_time"`
	EndTime         string   `json:"end_time"`
	Timezone        string   `json:"timezone"`
	Price           string   `json:"price"`
	PaidAt          *int64   `json:"paid_at,omitempty"`
	CancelledAt     *int64   `json:"cancelled_at,omitempty"`
	CustomerIDs     []string `json:"customer_ids,omitempty"`
	PaymentLinkID   *string  `json:"payment_link_id,omitempty"`
}
