package openai

import (
	"errors"
	"github.com/sashabaranov/go-openai"
)

var (
	Client *openai.Client

	ErrClientNotInitialised = errors.New("client not initialised")
)

func ClientProvider(Config *Config) error {
	Client = openai.NewClient(Config.ApiKey)
	return nil
}
