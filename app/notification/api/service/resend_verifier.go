package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"strconv"
	"strings"
	"time"

	"app/notification/config"
)

const resendTimestampToleranceSeconds = int64(5 * 60)

// resendVerifier holds the base64-decoded Svix signing secret.
type resendVerifier struct {
	secret []byte
}

func NewResendVerifier(rawSecret string) *resendVerifier {
	raw := strings.TrimSpace(rawSecret)
	if raw == "" {
		return nil
	}
	encoded := strings.TrimPrefix(raw, "whsec_")
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil
	}
	return &resendVerifier{secret: decoded}
}

func (v *resendVerifier) canHandle(h http.Header) bool {
	return h.Get("svix-id") != "" && h.Get("svix-timestamp") != "" && h.Get("svix-signature") != ""
}

func (v *resendVerifier) verify(h http.Header, body []byte) bool {
	if v == nil || len(v.secret) == 0 {
		return false
	}
	id := h.Get("svix-id")
	ts := h.Get("svix-timestamp")
	sigHeader := h.Get("svix-signature")
	if id == "" || ts == "" || sigHeader == "" {
		return false
	}
	tsInt, err := strconv.ParseInt(ts, 10, 64)
	if err != nil {
		return false
	}
	// Svix timestamp is unix seconds; tolerance window ±5 min.
	now := time.Now().Unix()
	delta := now - tsInt
	if delta < 0 {
		delta = -delta
	}
	if delta > resendTimestampToleranceSeconds {
		return false
	}

	toSign := id + "." + ts + "." + string(body)
	mac := hmac.New(sha256.New, v.secret)
	mac.Write([]byte(toSign))
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	for _, candidate := range strings.Split(sigHeader, " ") {
		parts := strings.SplitN(candidate, ",", 2)
		if len(parts) == 2 && parts[0] == "v1" && hmac.Equal([]byte(parts[1]), []byte(expected)) {
			return true
		}
	}
	return false
}

// ResendVerifierProvider constructs the Svix-based Resend webhook verifier
// from EmailConfig.WebhookSecret. Returns nil when the secret is absent,
// which leaves the webhook handler unable to claim Resend events (they fall
// through to 422 — appropriate when the service isn't configured to receive
// Resend webhooks).
func ResendVerifierProvider(cfg *config.EmailConfig) *resendVerifier {
	if cfg == nil {
		return nil
	}
	return NewResendVerifier(cfg.WebhookSecret)
}
