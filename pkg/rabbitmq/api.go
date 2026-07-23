package rabbitmq

import (
	rh "github.com/michaelklishin/rabbit-hole/v2"
	"go.uber.org/zap"
)

type ApiClient struct {
	*rh.Client
}

func NewApiClient(config *Config) (*ApiClient, error) {
	zap.L().Debug("connecting to rabbitmq api", zap.String("address", config.ApiAddress()))

	client, err := rh.NewClient(config.ApiAddress(), config.Username, config.Password)
	if err != nil {
		return nil, err
	}

	return &ApiClient{client}, nil
}
