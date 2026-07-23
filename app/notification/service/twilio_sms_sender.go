package service

import (
	"app/notification/config"
	"context"
	"pkg/twilio"
	"strings"
)

type twilioSMSSender struct {
	client      *twilio.SMSClient
	callbackURL string
}

func TwilioSMSClientProvider(smsConfig *config.SmsConfig) *twilio.SMSClient {
	if smsConfig == nil {
		return nil
	}
	return twilio.NewSMSClient(twilio.Config{
		AccountSID: strings.TrimSpace(smsConfig.AccountSID),
		AuthToken:  strings.TrimSpace(smsConfig.AuthToken),
		FromPhone:  strings.TrimSpace(smsConfig.FromPhone),
		BaseURL:    strings.TrimSpace(smsConfig.APIBaseURL),
	})
}

func SMSSenderProvider(client *twilio.SMSClient, publicWebhookURL config.PublicWebhookURL) SMSSender {
	if client == nil {
		return nil
	}
	return &twilioSMSSender{
		client:      client,
		callbackURL: strings.TrimSpace(string(publicWebhookURL)),
	}
}

func (s *twilioSMSSender) Send(ctx context.Context, message SMSMessage) (string, error) {
	return s.client.SendSMS(ctx, twilio.SendSMSRequest{
		ToPhone:        strings.TrimSpace(message.ToPhone),
		Body:           message.Body,
		StatusCallback: s.callbackURL,
	})
}
