package service

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"go.uber.org/zap"
)

// newHandler builds a webhookGatewayHandler that points at the provided URLs,
// using a real http.Client with a short timeout (for unreachable-host cases).
func newHandler(urls []string) *webhookGatewayHandler {
	return &webhookGatewayHandler{
		log:         zap.NewNop(),
		handlerURLs: urls,
		client:      &http.Client{Timeout: webhookHandlerTimeout},
	}
}

func TestWebhookGateway_FirstHandlerClaims(t *testing.T) {
	t.Parallel()

	var firstCalled, secondCalled int32

	second := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&secondCalled, 1)
		w.WriteHeader(http.StatusOK)
	}))
	defer second.Close()

	first := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&firstCalled, 1)
		w.WriteHeader(http.StatusOK)
	}))
	defer first.Close()

	h := newHandler([]string{first.URL, second.URL})
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader([]byte(`{"hello":"world"}`)))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if atomic.LoadInt32(&firstCalled) != 1 {
		t.Fatalf("expected first to be called once, got %d", firstCalled)
	}
	if atomic.LoadInt32(&secondCalled) != 0 {
		t.Fatalf("expected second to NOT be called, got %d", secondCalled)
	}
}

func TestWebhookGateway_FirstReturns422ThenSecondClaims(t *testing.T) {
	t.Parallel()

	var firstCalled, secondCalled int32

	first := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&firstCalled, 1)
		w.WriteHeader(422)
	}))
	defer first.Close()

	second := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&secondCalled, 1)
		w.WriteHeader(http.StatusOK)
	}))
	defer second.Close()

	h := newHandler([]string{first.URL, second.URL})
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader([]byte(`{}`)))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if atomic.LoadInt32(&firstCalled) != 1 || atomic.LoadInt32(&secondCalled) != 1 {
		t.Fatalf("expected both to be called once each, got first=%d second=%d", firstCalled, secondCalled)
	}
}

func TestWebhookGateway_AllReturn422_ReturnsOK(t *testing.T) {
	t.Parallel()

	first := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(422)
	}))
	defer first.Close()
	second := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(422)
	}))
	defer second.Close()

	h := newHandler([]string{first.URL, second.URL})
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader([]byte(`{}`)))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestWebhookGateway_HandlerReturns500_PropagatesError(t *testing.T) {
	t.Parallel()

	first := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer first.Close()

	h := newHandler([]string{first.URL})
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader([]byte(`{}`)))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

func TestWebhookGateway_AllUnreachable_Returns502(t *testing.T) {
	t.Parallel()

	// Use a TCP port unlikely to be in use (RFC 5737 documentation address).
	h := newHandler([]string{"http://192.0.2.1:9", "http://192.0.2.2:9"})
	h.client.Timeout = 200 * time.Millisecond
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader([]byte(`{}`)))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rr.Code)
	}
}

func TestWebhookGateway_ForwardsBodyAndHeadersByteIdentical(t *testing.T) {
	t.Parallel()

	bodyIn := []byte(`{"sig_dependent":"body"}`)
	var seenBody []byte
	var seenSigHeader, seenIDHeader, seenTSHeader string

	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		seenBody = b
		seenSigHeader = r.Header.Get("svix-signature")
		seenIDHeader = r.Header.Get("svix-id")
		seenTSHeader = r.Header.Get("svix-timestamp")
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	h := newHandler([]string{backend.URL})
	req := httptest.NewRequest(http.MethodPost, webhookPublicPath, bytes.NewReader(bodyIn))
	req.Header.Set("svix-id", "msg_123")
	req.Header.Set("svix-timestamp", "1700000000")
	req.Header.Set("svix-signature", "v1,abc")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if !bytes.Equal(seenBody, bodyIn) {
		t.Fatalf("body forwarded with modification: got %q want %q", seenBody, bodyIn)
	}
	if seenSigHeader != "v1,abc" || seenIDHeader != "msg_123" || seenTSHeader != "1700000000" {
		t.Fatalf("svix-* headers not forwarded faithfully")
	}
	if !strings.HasPrefix(rr.Result().Status, "200") {
		t.Fatalf("expected 200, got %s", rr.Result().Status)
	}
}
