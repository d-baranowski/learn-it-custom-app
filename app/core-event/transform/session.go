package transform

import (
	"context"

	coreevents "app/core/events"
	"app/core/model"
	"pkg/cdc/event"
	"pkg/cdc/wal"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type SessionTransformer struct {
	db  *bun.DB
	log *zap.Logger
}

func NewSessionTransformer(db *bun.DB, log *zap.Logger) *SessionTransformer {
	return &SessionTransformer{db: db, log: log.Named("transform.session")}
}

func (t *SessionTransformer) Transform(ctx context.Context, e wal.Event) ([]DomainEvent, error) {
	switch e.Action {
	case event.Insert:
		return t.onInsert(ctx, e)
	case event.Update:
		return t.onUpdate(ctx, e)
	case event.Delete:
		return t.onDelete(ctx, e)
	default:
		return nil, nil
	}
}

func (t *SessionTransformer) onInsert(ctx context.Context, e wal.Event) ([]DomainEvent, error) {
	payload, err := t.buildPayload(ctx, e.New)
	if err != nil {
		return nil, err
	}
	return []DomainEvent{{RoutingKey: coreevents.SessionCreated, Payload: payload}}, nil
}

func (t *SessionTransformer) onUpdate(ctx context.Context, e wal.Event) ([]DomainEvent, error) {
	payload, err := t.buildPayload(ctx, e.New)
	if err != nil {
		return nil, err
	}

	keys := sessionUpdateRoutingKeys(e)
	events := make([]DomainEvent, 0, len(keys))
	for _, key := range keys {
		events = append(events, DomainEvent{RoutingKey: key, Payload: payload})
	}
	return events, nil
}

// sessionUpdateRoutingKeys decides which domain events a session UPDATE emits,
// based on nil→non-nil transitions of the cancelled_at / paid_at columns.
// A fresh cancellation is cancel-only; a fresh payment emits session.updated
// plus the session.paid domain event; anything else is a plain update.
func sessionUpdateRoutingKeys(e wal.Event) []string {
	nowCancelled := isNonNil(e.New["cancelled_at"])
	wasCancelled := isNonNil(e.Old["cancelled_at"])
	nowPaid := isNonNil(e.New["paid_at"])
	wasPaid := isNonNil(e.Old["paid_at"])

	switch {
	case nowCancelled && !wasCancelled:
		return []string{coreevents.SessionCancelled}
	case nowPaid && !wasPaid:
		return []string{coreevents.SessionUpdated, coreevents.SessionPaid}
	default:
		return []string{coreevents.SessionUpdated}
	}
}

func (t *SessionTransformer) onDelete(_ context.Context, e wal.Event) ([]DomainEvent, error) {
	data := e.Old
	if len(data) == 0 {
		data = e.New
	}
	payload := t.payloadFromColumns(data)
	return []DomainEvent{{RoutingKey: coreevents.SessionCancelled, Payload: payload}}, nil
}

func (t *SessionTransformer) buildPayload(ctx context.Context, data map[string]any) (coreevents.SessionEventPayload, error) {
	payload := t.payloadFromColumns(data)

	sessionID := asString(data["id"])
	therapistID := asString(data["therapist_id"])

	if customerIDs, err := t.loadCustomerIDs(ctx, sessionID); err == nil {
		payload.CustomerIDs = customerIDs
	} else {
		t.log.Warn("failed to load customer IDs", zap.String("session_id", sessionID), zap.Error(err))
	}

	if userID, err := t.loadTherapistUserID(ctx, therapistID); err == nil {
		payload.TherapistUserID = userID
	} else {
		t.log.Warn("failed to load therapist user ID", zap.String("therapist_id", therapistID), zap.Error(err))
	}

	return payload, nil
}

func (t *SessionTransformer) payloadFromColumns(data map[string]any) coreevents.SessionEventPayload {
	p := coreevents.SessionEventPayload{
		SessionID:   asString(data["id"]),
		TherapistID: asString(data["therapist_id"]),
		Date:        model.NormalizeDateString(asString(data["date"])),
		StartTime:   asString(data["start_time"]),
		EndTime:     asString(data["end_time"]),
		Timezone:    asString(data["timezone"]),
		Price:       asString(data["price"]),
	}

	p.TherapyID = asString(data["therapy_id"])
	p.PaymentLinkID = asStringPtr(data["payment_link_id"])
	p.PaidAt = asInt64Ptr(data["paid_at"])
	p.CancelledAt = asInt64Ptr(data["cancelled_at"])

	return p
}

func (t *SessionTransformer) loadCustomerIDs(ctx context.Context, sessionID string) ([]string, error) {
	var ids []string
	err := t.db.NewSelect().
		TableExpr("core.session_customer").
		Column("customer_id").
		Where("session_id = ?", sessionID).
		Scan(ctx, &ids)
	return ids, err
}

func (t *SessionTransformer) loadTherapistUserID(ctx context.Context, therapistID string) (string, error) {
	var userID string
	err := t.db.NewSelect().
		TableExpr("core.therapist").
		Column("user_id").
		Where("id = ?", therapistID).
		Where("user_id IS NOT NULL").
		Limit(1).
		Scan(ctx, &userID)
	return userID, err
}
