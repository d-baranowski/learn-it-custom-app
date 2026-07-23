package config

type StripeConfig struct {
	PublishableKey string `envconfig:"STRIPE_PUBLISHABLE_KEY" default:""`
	SecretKey      string `envconfig:"STRIPE_SECRET_KEY" default:""`
	WebhookSecret  string `envconfig:"STRIPE_WEBHOOK_SECRET" default:""`
}
