package transform

import (
	"context"
	"database/sql"
	"errors"

	coreevents "app/core/events"
	"pkg/cdc/event"
	"pkg/cdc/wal"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type TherapistTransformer struct {
	db  *bun.DB
	log *zap.Logger
}

func NewTherapistTransformer(db *bun.DB, log *zap.Logger) *TherapistTransformer {
	return &TherapistTransformer{db: db, log: log.Named("transform.therapist")}
}

func (t *TherapistTransformer) Transform(ctx context.Context, e wal.Event) ([]DomainEvent, error) {
	if e.Action != event.Insert {
		return nil, nil
	}

	userID := asString(e.New["user_id"])
	if userID == "" {
		return nil, nil
	}

	therapistID := asString(e.New["id"])

	displayName, email, err := t.loadUserInfo(ctx, userID)
	if err != nil {
		t.log.Warn("failed to load user info for therapist",
			zap.String("therapist_id", therapistID),
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, nil
	}

	payload := coreevents.TherapistCreatedPayload{
		TherapistID: therapistID,
		UserID:      userID,
		DisplayName: displayName,
		Email:       email,
	}

	return []DomainEvent{{RoutingKey: coreevents.TherapistCreated, Payload: payload}}, nil
}

func (t *TherapistTransformer) loadUserInfo(ctx context.Context, userID string) (displayName, email string, err error) {
	err = t.db.NewSelect().
		TableExpr("core.user").
		Column("name", "email").
		Where("id = ?", userID).
		Limit(1).
		Scan(ctx, &displayName, &email)
	if errors.Is(err, sql.ErrNoRows) {
		return "", "", nil
	}
	return
}
