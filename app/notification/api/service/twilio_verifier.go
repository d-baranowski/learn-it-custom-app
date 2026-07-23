package service

import (
	"net/http"
	"strings"

	"app/notification/config"

	twiliolibclient "github.com/twilio/twilio-go/client"
)

type twilioVerifier struct {
	validator twiliolibclient.RequestValidator
	publicURL string
}

func NewTwilioVerifier(authToken, publicWebhookURL string) *twilioVerifier {
	token := strings.TrimSpace(authToken)
	url := strings.TrimSpace(publicWebhookURL)
	if token == "" || url == "" {
		return nil
	}
	return &twilioVerifier{
		validator: twiliolibclient.NewRequestValidator(token),
		publicURL: url,
	}
}

func (v *twilioVerifier) canHandle(h http.Header) bool {
	return h.Get("X-Twilio-Signature") != ""
}

func (v *twilioVerifier) verify(h http.Header, body []byte) bool {
	if v == nil {
		return false
	}
	sig := h.Get("X-Twilio-Signature")
	if sig == "" {
		return false
	}
	return v.validator.ValidateBody(v.publicURL, body, sig)
}

func TwilioVerifierProvider(smsCfg *config.SmsConfig, publicURL config.PublicWebhookURL) *twilioVerifier {
	if smsCfg == nil {
		return nil
	}
	return NewTwilioVerifier(smsCfg.AuthToken, string(publicURL))
}
