package service

import (
	"app/notification/config"
	"context"
	"pkg/resend"
	"strings"
)

type resendEmailSender struct {
	config *config.EmailConfig
}

func EmailSenderProvider(emailConfig *config.EmailConfig) EmailSender {
	if emailConfig == nil {
		return nil
	}
	return &resendEmailSender{config: emailConfig}
}

func (s *resendEmailSender) Send(ctx context.Context, message EmailMessage) (string, error) {
	cfg := s.config
	return resend.SendEmail(ctx, resend.Config{
		APIKey:      strings.TrimSpace(cfg.APIKey),
		FromAddress: strings.TrimSpace(cfg.FromAddress),
		FromName:    strings.TrimSpace(cfg.FromName),
	}, resend.SendEmailRequest{
		ToAddress:      strings.TrimSpace(message.ToEmail),
		Subject:        strings.TrimSpace(message.Subject),
		Body:           message.Body,
		IdempotencyKey: message.IdempotencyKey,
	})
}
