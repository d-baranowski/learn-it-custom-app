package service

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	notificationv1 "app/notification/gen/notification/v1"
	notificationservice "app/notification/service"
	"pkg/api"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

const (
	resendWebhookPath       = "/internal/resend-webhook"
	resendWebhookActor      = "resend-webhook"
	webhookNotClaimedStatus = 422
)

type ResendWebhookService struct {
	log    *zap.Logger
	db     *bun.DB
	dao    notificationservice.NotificationDAO
	resend *resendVerifier
}

type ResendWebhookServiceProps struct {
	fx.In

	ApiServer *api.Server
	DB        *bun.DB
	Log       *zap.Logger
	DAO       notificationservice.NotificationDAO
	Resend    *resendVerifier `optional:"true"`
}

func ResendWebhookServiceProvider(props ResendWebhookServiceProps) error {
	s := &ResendWebhookService{
		log:    props.Log.Named("resend-webhook"),
		db:     props.DB,
		dao:    props.DAO,
		resend: props.Resend,
	}
	props.ApiServer.AddHandler(resendWebhookPath, s)
	return nil
}

func (s *ResendWebhookService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}

	if s.resend == nil || !s.resend.canHandle(r.Header) {
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}
	if !s.resend.verify(r.Header, body) {
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}
	if err := s.processResendEvent(r.Context(), body); err != nil {
		s.log.Error("resend webhook processing failed", zap.Error(err))
		http.Error(w, "internal", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

type resendBounceData struct {
	Message string `json:"message"`
	SubType string `json:"subType"`
	Type    string `json:"type"`
}

type resendEvent struct {
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
	Data      struct {
		EmailID string            `json:"email_id"`
		From    string            `json:"from"`
		To      []string          `json:"to"`
		Subject string            `json:"subject"`
		Bounce  *resendBounceData `json:"bounce,omitempty"`
	} `json:"data"`
}

func (s *ResendWebhookService) processResendEvent(ctx context.Context, body []byte) error {
	var evt resendEvent
	if err := json.Unmarshal(body, &evt); err != nil {
		return err
	}
	if strings.TrimSpace(evt.Data.EmailID) == "" {
		s.log.Warn("resend webhook missing data.email_id", zap.String("type", evt.Type))
		return nil
	}

	status, reason, act := mapResendEventToStatus(evt)
	if !act {
		return nil
	}

	eventAtMs := evt.CreatedAt.UnixMilli()
	return s.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		matched, err := s.dao.ApplyDeliveryStatusTx(ctx, tx, resendWebhookActor, evt.Data.EmailID, status, reason, eventAtMs)
		if err != nil {
			return err
		}
		if !matched {
			s.log.Info("resend webhook ignored (no matching notification or stale event)",
				zap.String("type", evt.Type),
				zap.String("email_id", evt.Data.EmailID))
		}
		return nil
	})
}

func mapResendEventToStatus(evt resendEvent) (notificationv1.NotificationDeliveryStatus, *string, bool) {
	switch evt.Type {
	case "email.delivered":
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED, nil, true
	case "email.bounced":
		var reason *string
		if evt.Data.Bounce != nil {
			msg := strings.TrimSpace(evt.Data.Bounce.Message)
			if msg != "" {
				combined := evt.Data.Bounce.Type + ": " + msg
				reason = &combined
			}
		}
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_BOUNCED, reason, true
	case "email.complained":
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_COMPLAINED, nil, true
	case "email.delivery_delayed":
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELAYED, nil, true
	case "email.failed":
		reason := "delivery failed"
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED, &reason, true
	default:
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, nil, false
	}
}
