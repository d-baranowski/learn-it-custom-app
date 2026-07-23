package service

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"time"

	"app/gateway/config"
	"app/gateway/service"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

func backendURL(host, path string) string {
	if strings.HasPrefix(host, "http://") || strings.HasPrefix(host, "https://") {
		return host + path
	}
	return "http://" + host + path
}

const (
	webhookPublicPath       = "/webhook"
	webhookNotClaimedStatus = 422
	webhookHandlerTimeout   = 30 * time.Second
)

type webhookGatewayHandler struct {
	log         *zap.Logger
	handlerURLs []string
	client      *http.Client
}

type WebhookGatewayProps struct {
	fx.In

	Gateway  service.GatewayService
	Backends *config.Backends
	Log      *zap.Logger
}

func WebhookGatewayProvider(props WebhookGatewayProps) error {
	h := &webhookGatewayHandler{
		log: props.Log.Named("webhook-dispatch"),
		handlerURLs: []string{
			backendURL(props.Backends.Notification, "/internal/resend-webhook"),
			backendURL(props.Backends.Notification, "/internal/twilio-webhook"),
			backendURL(props.Backends.Payment, "/internal/webhook"),
		},
		client: &http.Client{Timeout: webhookHandlerTimeout},
	}
	props.Gateway.AddHandler(webhookPublicPath, h)
	return nil
}

func (h *webhookGatewayHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}

	anyReached := false
	for _, url := range h.handlerURLs {
		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, url, bytes.NewReader(body))
		if err != nil {
			h.log.Warn("failed to build backend webhook request", zap.String("url", url), zap.Error(err))
			continue
		}
		copyForwardableHeaders(r.Header, req.Header)

		resp, err := h.client.Do(req)
		if err != nil {
			h.log.Warn("webhook handler unreachable", zap.String("url", url), zap.Error(err))
			continue
		}
		anyReached = true
		_, _ = io.Copy(io.Discard, resp.Body)
		_ = resp.Body.Close()

		switch {
		case resp.StatusCode >= 200 && resp.StatusCode < 300:
			h.log.Info("webhook claimed", zap.String("url", url), zap.Int("status", resp.StatusCode))
			w.WriteHeader(resp.StatusCode)
			return
		case resp.StatusCode == webhookNotClaimedStatus:
			continue
		default:
			h.log.Warn("webhook handler returned error",
				zap.String("url", url),
				zap.Int("status", resp.StatusCode))
			w.WriteHeader(resp.StatusCode)
			return
		}
	}

	if !anyReached {
		http.Error(w, "no webhook handlers reachable", http.StatusBadGateway)
		return
	}

	h.log.Warn("webhook not claimed by any handler",
		zap.Int("handlers_tried", len(h.handlerURLs)))
	w.WriteHeader(http.StatusOK)
}

// copyForwardableHeaders copies everything except hop-by-hop headers + Host +
// Content-Length (re-set by http.NewRequestWithContext).
func copyForwardableHeaders(in, out http.Header) {
	skip := map[string]struct{}{
		"Connection":          {},
		"Keep-Alive":          {},
		"Proxy-Authenticate":  {},
		"Proxy-Authorization": {},
		"Te":                  {},
		"Trailers":            {},
		"Transfer-Encoding":   {},
		"Upgrade":             {},
		"Host":                {},
		"Content-Length":      {},
	}
	for k, vv := range in {
		if _, drop := skip[http.CanonicalHeaderKey(k)]; drop {
			continue
		}
		for _, v := range vv {
			out.Add(k, v)
		}
	}
}
