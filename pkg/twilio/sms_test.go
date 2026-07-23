package twilio

import (
	"context"
	"strings"
	"testing"

	twiliolibclient "github.com/twilio/twilio-go/client"
	twilioapi "github.com/twilio/twilio-go/rest/api/v2010"
)

type stubMessageSender struct {
	sendFn func(params *twilioapi.CreateMessageParams) (string, error)
}

func (s stubMessageSender) SendMessage(params *twilioapi.CreateMessageParams) (string, error) {
	if s.sendFn == nil {
		return "", nil
	}
	return s.sendFn(params)
}

func TestSendSMSValidation(t *testing.T) {
	_, err := SendSMS(context.Background(), Config{}, SendSMSRequest{
		ToPhone: "+1234567890",
		Body:    "Test message",
	})
	if err == nil || err.Error() != "twilio account sid is not configured" {
		t.Fatalf("expected account sid validation error, got %v", err)
	}

	_, err = SendSMS(context.Background(), Config{
		AccountSID: "AC123",
	}, SendSMSRequest{
		ToPhone: "+1234567890",
		Body:    "Test message",
	})
	if err == nil || err.Error() != "twilio auth token is not configured" {
		t.Fatalf("expected auth token validation error, got %v", err)
	}
}

func TestSendSMSSuccess(t *testing.T) {
	var capturedParams *twilioapi.CreateMessageParams

	client := NewSMSClientWithSender(Config{
		AccountSID: "AC123",
		AuthToken:  "token",
		FromPhone:  "+1987654321",
		BaseURL:    "https://api.twilio.com",
	}, stubMessageSender{
		sendFn: func(params *twilioapi.CreateMessageParams) (string, error) {
			capturedParams = params
			return "SM_test_123", nil
		},
	})
	sid, err := client.SendSMS(context.Background(), SendSMSRequest{
		ToPhone:        "+1234567890",
		Body:           "Test message",
		StatusCallback: "https://example.com/webhook",
	})

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if sid != "SM_test_123" {
		t.Fatalf("expected sid SM_test_123, got %q", sid)
	}
	if capturedParams == nil || capturedParams.To == nil || *capturedParams.To != "+1234567890" {
		t.Fatalf("unexpected To param")
	}
	if capturedParams.From == nil || *capturedParams.From != "+1987654321" {
		t.Fatalf("unexpected From param")
	}
	if capturedParams.Body == nil || *capturedParams.Body != "Test message" {
		t.Fatalf("unexpected Body param")
	}
	if capturedParams.StatusCallback == nil || *capturedParams.StatusCallback != "https://example.com/webhook" {
		t.Fatalf("unexpected StatusCallback param")
	}
}

func TestSendSMSOmitsStatusCallbackWhenEmpty(t *testing.T) {
	var capturedParams *twilioapi.CreateMessageParams

	client := NewSMSClientWithSender(Config{
		AccountSID: "AC123",
		AuthToken:  "token",
		FromPhone:  "+1987654321",
		BaseURL:    "https://api.twilio.com",
	}, stubMessageSender{
		sendFn: func(params *twilioapi.CreateMessageParams) (string, error) {
			capturedParams = params
			return "SM_x", nil
		},
	})
	if _, err := client.SendSMS(context.Background(), SendSMSRequest{
		ToPhone: "+1234567890",
		Body:    "Test message",
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if capturedParams.StatusCallback != nil {
		t.Fatalf("expected nil StatusCallback, got %q", *capturedParams.StatusCallback)
	}
}

func TestSendSMSReturnsErrorOnNon2xx(t *testing.T) {
	client := NewSMSClientWithSender(Config{
		AccountSID: "AC123",
		AuthToken:  "token",
		FromPhone:  "+1987654321",
		BaseURL:    "https://api.twilio.com",
	}, stubMessageSender{
		sendFn: func(params *twilioapi.CreateMessageParams) (string, error) {
			return "", &twiliolibclient.TwilioRestError{
				Status:  401,
				Message: "invalid credentials",
			}
		},
	})
	_, err := client.SendSMS(context.Background(), SendSMSRequest{
		ToPhone: "+1234567890",
		Body:    "Test message",
	})

	if err == nil {
		t.Fatalf("expected non-2xx error")
	}
	if !strings.Contains(err.Error(), "status 401") {
		t.Fatalf("expected status code in error, got %v", err)
	}
}

func TestSendSMSUnsupportedCustomBaseURL(t *testing.T) {
	client := NewSMSClientWithSender(Config{
		AccountSID: "AC123",
		AuthToken:  "token",
		FromPhone:  "+1987654321",
		BaseURL:    "https://example.invalid",
	}, stubMessageSender{})
	_, err := client.SendSMS(context.Background(), SendSMSRequest{
		ToPhone: "+1234567890",
		Body:    "Test message",
	})

	if err == nil || err.Error() != "twilio custom base url is not supported by twilio-go client" {
		t.Fatalf("expected unsupported base url error, got %v", err)
	}
}

func TestMessageSenderProviderTrimsCredentials(t *testing.T) {
	sender := MessageSenderProvider(Config{
		AccountSID: " AC123 ",
		AuthToken:  " token ",
	})

	defaultSender, ok := sender.(*defaultMessageSender)
	if !ok {
		t.Fatalf("expected default message sender type")
	}
	if defaultSender.client == nil || defaultSender.client.RequestHandler == nil {
		t.Fatalf("expected initialized twilio rest client")
	}

	client, ok := defaultSender.client.RequestHandler.Client.(*twiliolibclient.Client)
	if !ok {
		t.Fatalf("expected twilio base client")
	}
	if client.Username != "AC123" || client.Password != "token" {
		t.Fatalf("unexpected credentials in twilio client: username=%q password=%q", client.Username, client.Password)
	}
}
