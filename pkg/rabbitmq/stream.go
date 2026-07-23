package rabbitmq

import (
	"crypto/tls"
	"github.com/rabbitmq/rabbitmq-stream-go-client/pkg/stream"
	"go.uber.org/zap"
)

func NewStreamEnvironment(config *Config) (*stream.Environment, error) {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: config.TLSSkipVerify,
	}

	streamEnvOpts := stream.NewEnvironmentOptions().
		SetHost(config.Host).
		SetPort(config.StreamPort).
		SetUser(config.Username).
		SetPassword(config.Password).
		SetVHost(config.VHost).
		IsTLS(config.TLS).
		SetTLSConfig(tlsConfig)

	if config.UseStreamAddressResolver {
		addressResolver := stream.AddressResolver{
			Host: config.Host,
			Port: config.StreamPort,
		}
		streamEnvOpts.SetAddressResolver(addressResolver)
	}

	env, err := stream.NewEnvironment(streamEnvOpts)

	if err != nil {
		return nil, err
	}

	return env, nil
}

func NewStreamProducer(env *stream.Environment, id, streamName string,
	producerOptions *stream.ProducerOptions) (*stream.Producer, error) {

	exists, err := env.StreamExists(streamName)
	if err != nil {
		zap.L().Error("failed to check if stream exists", zap.Error(err))
		return nil, err
	}

	if !exists {
		zap.L().Error("stream does not exist", zap.String("stream", streamName))
		return nil, stream.ErrMessageRouteNotFound
	}

	if producerOptions == nil {
		producerOptions = stream.NewProducerOptions()
		producerOptions.SetProducerName(id)
	} else {
		// check if id is empty
		if producerOptions.Name == "" {
			producerOptions.SetProducerName(id)
		}
	}

	producer, err := env.NewProducer(streamName, producerOptions)
	if err != nil {
		zap.L().Error("failed to create producer", zap.Error(err))
		return nil, err
	}

	return producer, nil
}
