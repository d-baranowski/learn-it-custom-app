package resend

import (
	"context"
	"fmt"
	"strings"

	resendgo "github.com/resend/resend-go/v3"
)

type Config struct {
	APIKey      string
	FromAddress string
	FromName    string
}

type SendEmailRequest struct {
	ToAddress string
	Subject   string
	Body      string
	IdempotencyKey *string
}

func SendEmail(ctx context.Context, cfg Config, req SendEmailRequest) (string, error) {
	apiKey := strings.TrimSpace(cfg.APIKey)
	if apiKey == "" {
		return "", fmt.Errorf("resend api key is not configured")
	}
	if strings.TrimSpace(cfg.FromAddress) == "" {
		return "", fmt.Errorf("outbound email sender address is not configured")
	}
	if strings.TrimSpace(req.ToAddress) == "" {
		return "", fmt.Errorf("recipient email is required")
	}
	if strings.TrimSpace(req.Subject) == "" {
		return "", fmt.Errorf("email subject is required")
	}

	client := resendgo.NewClient(apiKey)
	emailRequest := &resendgo.SendEmailRequest{
		From:    FormatFrom(cfg.FromName, cfg.FromAddress),
		To:      []string{strings.TrimSpace(req.ToAddress)},
		Subject: strings.TrimSpace(req.Subject),
		Text:    req.Body,
	}
	options := resendgo.SendEmailOptions{}
	if req.IdempotencyKey != nil {
		options.IdempotencyKey = *req.IdempotencyKey
	}
	resp, err := client.Emails.SendWithOptions(ctx, emailRequest, &options)
	if err != nil {
		return "", err
	}
	if resp == nil {
		return "", nil
	}
	return resp.Id, nil
}

func FormatFrom(name string, address string) string {
	address = strings.TrimSpace(address)
	name = strings.TrimSpace(name)
	if name == "" {
		return address
	}
	return fmt.Sprintf("%s <%s>", name, address)
}
