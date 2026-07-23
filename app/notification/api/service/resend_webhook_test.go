package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/model"
	notificationservice "app/notification/service"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

// fakeDAO records the last ApplyDeliveryStatusTx invocation and lets tests
// drive its return values.
type fakeDAO struct {
	calls []applyArgs

	matchedReturn bool
	errReturn     error
}

type applyArgs struct {
	actor             string
	providerMessageID string
	status            notificationv1.NotificationDeliveryStatus
	failureReason     *string
	eventAt           int64
}

func (f *fakeDAO) UpsertNotification(ctx context.Context, in notificationservice.NotificationUpsertModel) (*model.Notification, bool, error) {
	return nil, false, errors.New("not used")
}
func (f *fakeDAO) ClaimPendingTx(ctx context.Context, tx bun.Tx) (*model.Notification, error) {
	return nil, errors.New("not used")
}
func (f *fakeDAO) MarkSentTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy, providerMessageID string) error {
	return errors.New("not used")
}
func (f *fakeDAO) MarkAttemptFailedTx(ctx context.Context, tx bun.Tx, notificationID, updatedBy string, sendErr error, attemptCount int, nextAttemptAt *int64, terminal bool) error {
	return errors.New("not used")
}
func (f *fakeDAO) ApplyDeliveryStatusTx(ctx context.Context, tx bun.Tx, actor, providerMessageID string, status notificationv1.NotificationDeliveryStatus, failureReason *string, eventAt int64) (bool, error) {
	f.calls = append(f.calls, applyArgs{
		actor:             actor,
		providerMessageID: providerMessageID,
		status:            status,
		failureReason:     failureReason,
		eventAt:           eventAt,
	})
	return f.matchedReturn, f.errReturn
}

// sign builds a Svix-compatible signed request for testing the resend verifier.
func sign(t *testing.T, secret []byte, body []byte, opts ...func(*signOpts)) *http.Request {
	t.Helper()
	o := signOpts{
		id: "msg_test",
		ts: strconv.FormatInt(time.Now().Unix(), 10),
	}
	for _, fn := range opts {
		fn(&o)
	}
	toSign := o.id + "." + o.ts + "." + string(body)
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(toSign))
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	req := httptest.NewRequest(http.MethodPost, resendWebhookPath, bytesReader(body))
	req.Header.Set("svix-id", o.id)
	req.Header.Set("svix-timestamp", o.ts)
	if o.overrideSig != "" {
		req.Header.Set("svix-signature", o.overrideSig)
	} else {
		req.Header.Set("svix-signature", "v1,"+expected)
	}
	return req
}

type signOpts struct {
	id          string
	ts          string
	overrideSig string
}

func withTimestamp(ts string) func(*signOpts)     { return func(o *signOpts) { o.ts = ts } }
func withBadSignature() func(*signOpts)           { return func(o *signOpts) { o.overrideSig = "v1,bogus" } }
func bytesReader(b []byte) *byteReadCloser { return &byteReadCloser{b: b} }

type byteReadCloser struct {
	b []byte
	o int
}

func (r *byteReadCloser) Read(p []byte) (int, error) {
	if r.o >= len(r.b) {
		return 0, io.EOF
	}
	n := copy(p, r.b[r.o:])
	r.o += n
	return n, nil
}
func (r *byteReadCloser) Close() error { return nil }

func newTestService(dao notificationservice.NotificationDAO, secret []byte) *ResendWebhookService {
	return &ResendWebhookService{
		log:    zap.NewNop(),
		dao:    dao,
		resend: &resendVerifier{secret: secret},
	}
}

func TestResendVerifier_RoundtripValidSignature(t *testing.T) {
	t.Parallel()
	secret := []byte("test-secret")
	v := &resendVerifier{secret: secret}

	body := []byte(`{"type":"email.delivered","created_at":"2026-01-15T12:00:00.000Z","data":{"email_id":"abc-123","from":"a@b.com","to":["c@d.com"],"subject":"hi"}}`)
	req := sign(t, secret, body)

	if !v.canHandle(req.Header) {
		t.Fatal("expected canHandle=true")
	}
	if !v.verify(req.Header, body) {
		t.Fatal("expected verify=true for matching signature")
	}
}

func TestResendVerifier_NoSvixHeaders_CanHandleFalse(t *testing.T) {
	t.Parallel()
	v := &resendVerifier{secret: []byte("k")}

	req := httptest.NewRequest(http.MethodPost, resendWebhookPath, bytesReader([]byte(`{}`)))
	if v.canHandle(req.Header) {
		t.Fatal("expected canHandle=false without svix headers")
	}
}

func TestResendVerifier_WrongSignature_VerifyFalse(t *testing.T) {
	t.Parallel()
	secret := []byte("real-secret")
	v := &resendVerifier{secret: secret}

	body := []byte(`{"hello":"world"}`)
	req := sign(t, []byte("wrong-secret"), body)

	if !v.canHandle(req.Header) {
		t.Fatal("expected canHandle=true (headers present)")
	}
	if v.verify(req.Header, body) {
		t.Fatal("expected verify=false (signed with different secret)")
	}
}

func TestResendVerifier_StaleTimestamp_Rejected(t *testing.T) {
	t.Parallel()
	secret := []byte("k")
	v := &resendVerifier{secret: secret}

	body := []byte(`{}`)
	// 10 minutes ago — outside the 5-min tolerance.
	staleTS := strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10)
	req := sign(t, secret, body, withTimestamp(staleTS))

	if v.verify(req.Header, body) {
		t.Fatal("expected verify=false for stale timestamp")
	}
}

func TestResendVerifier_MultipleSignatures_MatchesAny(t *testing.T) {
	t.Parallel()
	secret := []byte("k")
	v := &resendVerifier{secret: secret}

	body := []byte(`{}`)
	id := "msg_x"
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	toSign := id + "." + ts + "." + string(body)
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(toSign))
	good := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	req := httptest.NewRequest(http.MethodPost, resendWebhookPath, bytesReader(body))
	req.Header.Set("svix-id", id)
	req.Header.Set("svix-timestamp", ts)
	req.Header.Set("svix-signature", "v1,bogus v1,"+good+" v1,other")

	if !v.verify(req.Header, body) {
		t.Fatal("expected verify=true when one of multiple signatures matches")
	}
}

func TestResendWebhook_NoSvixHeaders_Returns422(t *testing.T) {
	t.Parallel()
	svc := newTestService(&fakeDAO{}, []byte("k"))

	req := httptest.NewRequest(http.MethodPost, resendWebhookPath, bytesReader([]byte(`{}`)))
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestResendWebhook_BadSignature_Returns422(t *testing.T) {
	t.Parallel()
	svc := newTestService(&fakeDAO{}, []byte("k"))

	body := []byte(`{}`)
	req := sign(t, []byte("k"), body, withBadSignature())
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestMapResendEventToStatus(t *testing.T) {
	t.Parallel()

	cases := []struct {
		eventType string
		expect    notificationv1.NotificationDeliveryStatus
		act       bool
	}{
		{"email.delivered", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED, true},
		{"email.bounced", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_BOUNCED, true},
		{"email.complained", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_COMPLAINED, true},
		{"email.delivery_delayed", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELAYED, true},
		{"email.failed", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED, true},
		{"email.sent", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"email.opened", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"email.clicked", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"unknown.type", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
	}

	for _, tc := range cases {
		got, _, act := mapResendEventToStatus(resendEvent{Type: tc.eventType})
		if got != tc.expect || act != tc.act {
			t.Errorf("mapResendEventToStatus(%q) = (%d, _, %v), want (%d, _, %v)", tc.eventType, got, act, tc.expect, tc.act)
		}
	}
}
