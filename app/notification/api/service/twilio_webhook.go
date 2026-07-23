package service

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/url"
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
	twilioWebhookPath  = "/internal/twilio-webhook"
	twilioWebhookActor = "twilio-webhook"
)

type TwilioWebhookService struct {
	log     *zap.Logger
	dao     notificationservice.NotificationDAO
	twilio  *twilioVerifier
	runInTx func(ctx context.Context, fn func(context.Context, bun.Tx) error) error
}

type TwilioWebhookServiceProps struct {
	fx.In

	ApiServer *api.Server
	DB        *bun.DB
	Log       *zap.Logger
	DAO       notificationservice.NotificationDAO
	Twilio    *twilioVerifier `optional:"true"`
}

func TwilioWebhookServiceProvider(props TwilioWebhookServiceProps) error {
	db := props.DB
	s := &TwilioWebhookService{
		log:    props.Log.Named("twilio-webhook"),
		dao:    props.DAO,
		twilio: props.Twilio,
		runInTx: func(ctx context.Context, fn func(context.Context, bun.Tx) error) error {
			return db.RunInTx(ctx, nil, fn)
		},
	}
	props.ApiServer.AddHandler(twilioWebhookPath, s)
	return nil
}

func (s *TwilioWebhookService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}

	if s.twilio == nil || !s.twilio.canHandle(r.Header) {
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}
	if !s.twilio.verify(r.Header, body) {
		w.WriteHeader(webhookNotClaimedStatus)
		return
	}
	if err := s.processTwilioEvent(r.Context(), body); err != nil {
		s.log.Error("twilio webhook processing failed", zap.Error(err))
		http.Error(w, "internal", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *TwilioWebhookService) processTwilioEvent(ctx context.Context, body []byte) error {
	form, err := url.ParseQuery(string(body))
	if err != nil {
		return err
	}
	sid := strings.TrimSpace(form.Get("MessageSid"))
	if sid == "" {
		s.log.Warn("twilio webhook missing MessageSid",
			zap.String("status", form.Get("MessageStatus")))
		return nil
	}
	rawStatus := strings.ToLower(strings.TrimSpace(form.Get("MessageStatus")))
	status, reason, act := mapTwilioStatus(rawStatus, form)
	if !act {
		return nil
	}

	eventAtMs := time.Now().UnixMilli()
	return s.runInTx(ctx, func(ctx context.Context, tx bun.Tx) error {
		matched, err := s.dao.ApplyDeliveryStatusTx(ctx, tx, twilioWebhookActor, sid, status, reason, eventAtMs)
		if err != nil {
			return err
		}
		if !matched {
			s.log.Info("twilio webhook ignored (no matching notification or stale event)",
				zap.String("status", rawStatus),
				zap.String("message_sid", sid))
		}
		return nil
	})
}

// mapTwilioStatus returns the delivery status enum + an optional failure reason,
// and a bool indicating whether the event should be persisted. Intermediate
// states (queued/sending/sent) are accepted (200 OK) but not written, so
// out-of-order acknowledgements can't downgrade a later terminal state.
func mapTwilioStatus(status string, form url.Values) (notificationv1.NotificationDeliveryStatus, *string, bool) {
	switch status {
	case "delivered", "read":
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED, nil, true
	case "failed", "undelivered":
		reason := twilioFailureReason(form)
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED, reason, true
	default:
		return notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, nil, false
	}
}

func twilioFailureReason(form url.Values) *string {
	code := strings.TrimSpace(form.Get("ErrorCode"))
	msg := strings.TrimSpace(form.Get("ErrorMessage"))
	if code == "" && msg == "" {
		return nil
	}
	var b bytes.Buffer
	if code != "" {
		b.WriteString(code)
	}
	if msg != "" {
		if b.Len() > 0 {
			b.WriteString(": ")
		}
		b.WriteString(msg)
	}
	combined := b.String()
	return &combined
}
