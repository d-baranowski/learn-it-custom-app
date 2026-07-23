package events

const TherapistCreated = "therapist.created"

type TherapistCreatedPayload struct {
	TherapistID string `json:"therapist_id"`
	UserID      string `json:"user_id"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
}
