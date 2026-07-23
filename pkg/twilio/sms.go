package twilio

import (
	"context"
	"errors"
	"fmt"
	"strings"

	twilioclient "github.com/twilio/twilio-go"
	twiliolibclient "github.com/twilio/twilio-go/client"
	twilioapi "github.com/twilio/twilio-go/rest/api/v2010"
)

type Config struct {
	AccountSID string
	AuthToken  string
	FromPhone  string
	BaseURL    string
}

type SendSMSRequest struct {
	ToPhone        string
	Body           string
	StatusCallback string
}

type MessageSender interface {
	SendMessage(params *twilioapi.CreateMessageParams) (string, error)
}

type defaultMessageSender struct {
	client *twilioclient.RestClient
}

type SMSClient struct {
	cfg    Config
	sender MessageSender
}

func NewSMSClient(cfg Config) *SMSClient {
	return NewSMSClientWithSender(cfg, MessageSenderProvider(cfg))
}

func NewSMSClientWithSender(cfg Config, sender MessageSender) *SMSClient {
	return &SMSClient{cfg: cfg, sender: sender}
}

func SendSMS(ctx context.Context, cfg Config, req SendSMSRequest) (string, error) {
	return NewSMSClient(cfg).SendSMS(ctx, req)
}

func (c *SMSClient) SendSMS(ctx context.Context, req SendSMSRequest) (string, error) {
	if ctx != nil {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}
	}

	cfg := c.cfg
	accountSID := strings.TrimSpace(cfg.AccountSID)
	if accountSID == "" {
		return "", fmt.Errorf("twilio account sid is not configured")
	}

	authToken := strings.TrimSpace(cfg.AuthToken)
	if authToken == "" {
		return "", fmt.Errorf("twilio auth token is not configured")
	}

	fromPhone := strings.TrimSpace(cfg.FromPhone)
	if fromPhone == "" {
		return "", fmt.Errorf("twilio from phone is not configured")
	}

	toPhone := strings.TrimSpace(req.ToPhone)
	if toPhone == "" {
		return "", fmt.Errorf("recipient phone is required")
	}

	body := strings.TrimSpace(req.Body)
	if body == "" {
		return "", fmt.Errorf("sms body is required")
	}

	baseURL := strings.TrimSpace(cfg.BaseURL)
	if baseURL != "" && strings.TrimRight(baseURL, "/") != "https://api.twilio.com" {
		return "", fmt.Errorf("twilio custom base url is not supported by twilio-go client")
	}
	if c.sender == nil {
		return "", fmt.Errorf("twilio sender is required")
	}

	params := &twilioapi.CreateMessageParams{}
	params.SetTo(toPhone)
	params.SetFrom(fromPhone)
	params.SetBody(body)
	if cb := strings.TrimSpace(req.StatusCallback); cb != "" {
		params.SetStatusCallback(cb)
	}

	sid, err := c.sender.SendMessage(params)
	if err != nil {
		var twilioErr *twiliolibclient.TwilioRestError
		if errors.As(err, &twilioErr) {
			message := strings.TrimSpace(twilioErr.Message)
			if message == "" {
				return "", fmt.Errorf("twilio request failed with status %d", twilioErr.Status)
			}
			return "", fmt.Errorf("twilio request failed with status %d: %s", twilioErr.Status, message)
		}
		return "", err
	}
	return sid, nil
}

func MessageSenderProvider(cfg Config) MessageSender {
	return &defaultMessageSender{
		client: twilioclient.NewRestClientWithParams(twilioclient.ClientParams{
			Username: strings.TrimSpace(cfg.AccountSID),
			Password: strings.TrimSpace(cfg.AuthToken),
		}),
	}
}

func (s *defaultMessageSender) SendMessage(params *twilioapi.CreateMessageParams) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("twilio client is required")
	}
	if params == nil {
		return "", fmt.Errorf("twilio message params are required")
	}

	resp, err := s.client.Api.CreateMessage(params)
	if err != nil {
		return "", err
	}
	if resp == nil || resp.Sid == nil {
		return "", nil
	}
	return *resp.Sid, nil
}
