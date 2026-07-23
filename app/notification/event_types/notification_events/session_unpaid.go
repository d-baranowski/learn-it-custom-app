package notification_events

const SessionUnpaidEventKey = "session.unpaid"

var SessionUnpaidEvent = EventDefinition{
	Key:         SessionUnpaidEventKey,
	DisplayName: "Session Unpaid",
	Description: "Sent when unpaid sessions are due and a therapist should be notified.",
	Payload:     SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Sessions  []SessionUnpaidSessionDetail   `json:"sessions"`
	Therapist *SessionUnpaidTherapistPayload `json:"therapist,omitempty"`
}

type SessionUnpaidSessionDetail struct {
	ID        string                         `json:"id"`
	Date      string                         `json:"date" notification:"date"`
	StartAt   string                         `json:"startAt" notification:"datetime"`
	AmountDue string                         `json:"amountDue"`
	Currency  string                         `json:"currency"`
	Customers []SessionUnpaidCustomerPayload `json:"customers"`
	Payment   *SessionUnpaidPaymentPayload   `json:"payment,omitempty"`
}

type SessionUnpaidCustomerPayload struct {
	FullName string `json:"fullName"`
}

type SessionUnpaidTherapistPayload struct {
	FullName string `json:"fullName"`
}

type SessionUnpaidPaymentPayload struct {
	Link string `json:"link"`
}
