package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"strings"
	"testing"

	notificationv1 "app/notification/gen/notification/v1"

	"github.com/uptrace/bun"
	twiliolibclient "github.com/twilio/twilio-go/client"
	"go.uber.org/zap"
)

const (
	testTwilioAuthToken = "twilio-test-auth-token"
	testTwilioPublicURL = "https://example.com/webhook"
)

// twilioSignedForm returns a valid POST request with a Twilio-style signature
// against the given public URL + form params.
func twilioSignedForm(t *testing.T, authToken, publicURL string, form url.Values) *http.Request {
	t.Helper()
	v := twiliolibclient.NewRequestValidator(authToken)
	body := form.Encode()
	// Twilio signs URL + key1value1key2value2... (sorted keys).
	params := map[string]string{}
	for k, vs := range form {
		if len(vs) > 0 {
			params[k] = vs[0]
		}
	}
	sig := computeTwilioSig(t, v, publicURL, params)
	req := httptest.NewRequest(http.MethodPost, twilioWebhookPath, strings.NewReader(body))
	req.Header.Set("X-Twilio-Signature", sig)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return req
}

func computeTwilioSig(t *testing.T, _ twiliolibclient.RequestValidator, publicURL string, params map[string]string) string {
	t.Helper()
	return twilioComputeSig(testTwilioAuthToken, publicURL, params)
}

// twilioComputeSig replicates RequestValidator.getValidationSignature: HMAC-SHA1
// of (URL + sortedKey1value1 + sortedKey2value2 …) using the auth token as key,
// then base64-encoded.
func twilioComputeSig(authToken, publicURL string, params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	data := publicURL
	for _, k := range keys {
		data += k + params[k]
	}
	mac := hmac.New(sha1.New, []byte(authToken))
	mac.Write([]byte(data))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func TestTwilioVerifier_RoundtripValidSignature(t *testing.T) {
	t.Parallel()
	v := NewTwilioVerifier(testTwilioAuthToken, testTwilioPublicURL)
	if v == nil {
		t.Fatal("expected verifier")
	}

	form := url.Values{}
	form.Set("MessageSid", "SM_abc")
	form.Set("MessageStatus", "delivered")
	req := twilioSignedForm(t, testTwilioAuthToken, testTwilioPublicURL, form)
	body := []byte(form.Encode())

	if !v.canHandle(req.Header) {
		t.Fatal("expected canHandle=true")
	}
	if !v.verify(req.Header, body) {
		t.Fatal("expected verify=true for matching signature")
	}
}

func TestTwilioVerifier_MissingHeader_CanHandleFalse(t *testing.T) {
	t.Parallel()
	v := NewTwilioVerifier(testTwilioAuthToken, testTwilioPublicURL)
	req := httptest.NewRequest(http.MethodPost, twilioWebhookPath, strings.NewReader("MessageSid=SM_x"))
	if v.canHandle(req.Header) {
		t.Fatal("expected canHandle=false without X-Twilio-Signature header")
	}
}

func TestTwilioVerifier_TamperedBody_VerifyFalse(t *testing.T) {
	t.Parallel()
	v := NewTwilioVerifier(testTwilioAuthToken, testTwilioPublicURL)

	form := url.Values{}
	form.Set("MessageSid", "SM_abc")
	form.Set("MessageStatus", "delivered")
	req := twilioSignedForm(t, testTwilioAuthToken, testTwilioPublicURL, form)

	// Tamper after signing.
	tampered := []byte("MessageSid=SM_evil&MessageStatus=delivered")
	if v.verify(req.Header, tampered) {
		t.Fatal("expected verify=false after tampering body")
	}
}

func TestTwilioVerifier_NilWhenSecretMissing(t *testing.T) {
	t.Parallel()
	if v := NewTwilioVerifier("", testTwilioPublicURL); v != nil {
		t.Fatal("expected nil verifier when auth token missing")
	}
	if v := NewTwilioVerifier(testTwilioAuthToken, ""); v != nil {
		t.Fatal("expected nil verifier when public url missing")
	}
}

func TestTwilioWebhook_MissingSignature_Returns422(t *testing.T) {
	t.Parallel()
	svc := newTwilioTestService(&fakeDAO{}, testTwilioAuthToken, testTwilioPublicURL)

	req := httptest.NewRequest(http.MethodPost, twilioWebhookPath, strings.NewReader("MessageSid=SM_x"))
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestTwilioWebhook_BadSignature_Returns422(t *testing.T) {
	t.Parallel()
	svc := newTwilioTestService(&fakeDAO{}, testTwilioAuthToken, testTwilioPublicURL)

	req := httptest.NewRequest(http.MethodPost, twilioWebhookPath, strings.NewReader("MessageSid=SM_x&MessageStatus=delivered"))
	req.Header.Set("X-Twilio-Signature", "bogus-signature")
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != webhookNotClaimedStatus {
		t.Fatalf("expected %d, got %d", webhookNotClaimedStatus, rr.Code)
	}
}

func TestTwilioWebhook_DeliveredEvent_CallsDAOWithActor(t *testing.T) {
	t.Parallel()
	dao := &fakeDAO{matchedReturn: true}
	svc := newTwilioTestService(dao, testTwilioAuthToken, testTwilioPublicURL)

	form := url.Values{}
	form.Set("MessageSid", "SM_abc123")
	form.Set("MessageStatus", "delivered")
	req := twilioSignedForm(t, testTwilioAuthToken, testTwilioPublicURL, form)
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if len(dao.calls) != 1 {
		t.Fatalf("expected 1 DAO call, got %d", len(dao.calls))
	}
	c := dao.calls[0]
	if c.actor != "twilio-webhook" {
		t.Errorf("expected actor=twilio-webhook, got %q", c.actor)
	}
	if c.providerMessageID != "SM_abc123" {
		t.Errorf("expected providerMessageID=SM_abc123, got %q", c.providerMessageID)
	}
	if c.status != notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED {
		t.Errorf("expected DELIVERED, got %d", c.status)
	}
	if c.failureReason != nil {
		t.Errorf("expected nil reason, got %q", *c.failureReason)
	}
}

func TestTwilioWebhook_FailedEvent_CapturesErrorReason(t *testing.T) {
	t.Parallel()
	dao := &fakeDAO{matchedReturn: true}
	svc := newTwilioTestService(dao, testTwilioAuthToken, testTwilioPublicURL)

	form := url.Values{}
	form.Set("MessageSid", "SM_failed")
	form.Set("MessageStatus", "failed")
	form.Set("ErrorCode", "30003")
	form.Set("ErrorMessage", "Unreachable destination handset")
	req := twilioSignedForm(t, testTwilioAuthToken, testTwilioPublicURL, form)
	rr := httptest.NewRecorder()
	svc.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if len(dao.calls) != 1 {
		t.Fatalf("expected 1 DAO call, got %d", len(dao.calls))
	}
	c := dao.calls[0]
	if c.status != notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED {
		t.Errorf("expected FAILED, got %d", c.status)
	}
	if c.failureReason == nil || *c.failureReason != "30003: Unreachable destination handset" {
		t.Errorf("expected failure reason populated, got %v", c.failureReason)
	}
}

func TestTwilioWebhook_IntermediateStatus_NoDAOCall(t *testing.T) {
	t.Parallel()
	for _, status := range []string{"queued", "accepted", "sending", "sent"} {
		status := status
		t.Run(status, func(t *testing.T) {
			t.Parallel()
			dao := &fakeDAO{}
			svc := newTwilioTestService(dao, testTwilioAuthToken, testTwilioPublicURL)

			form := url.Values{}
			form.Set("MessageSid", "SM_x")
			form.Set("MessageStatus", status)
			req := twilioSignedForm(t, testTwilioAuthToken, testTwilioPublicURL, form)
			rr := httptest.NewRecorder()
			svc.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", rr.Code)
			}
			if len(dao.calls) != 0 {
				t.Fatalf("expected no DAO calls for intermediate status %q, got %d", status, len(dao.calls))
			}
		})
	}
}

func TestMapTwilioStatus(t *testing.T) {
	t.Parallel()
	cases := []struct {
		input  string
		expect notificationv1.NotificationDeliveryStatus
		act    bool
	}{
		{"delivered", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED, true},
		{"read", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_DELIVERED, true},
		{"failed", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED, true},
		{"undelivered", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_FAILED, true},
		{"queued", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"sending", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"sent", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
		{"unknown", notificationv1.NotificationDeliveryStatus_NOTIFICATION_DELIVERY_STATUS_UNKNOWN, false},
	}
	for _, tc := range cases {
		got, _, act := mapTwilioStatus(tc.input, url.Values{})
		if got != tc.expect || act != tc.act {
			t.Errorf("mapTwilioStatus(%q) = (%d, _, %v), want (%d, _, %v)",
				tc.input, got, act, tc.expect, tc.act)
		}
	}
}

func newTwilioTestService(dao *fakeDAO, authToken, publicURL string) *TwilioWebhookService {
	return &TwilioWebhookService{
		log:    zap.NewNop(),
		dao:    dao,
		twilio: NewTwilioVerifier(authToken, publicURL),
		runInTx: func(ctx context.Context, fn func(context.Context, bun.Tx) error) error {
			return fn(ctx, bun.Tx{})
		},
	}
}
