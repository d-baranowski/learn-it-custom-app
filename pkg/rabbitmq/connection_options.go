package rabbitmq

import (
	"go.uber.org/zap"
	"time"
)

// ConnectionOptions are used to describe how a new consumer will be created.
type ConnectionOptions struct {
	ReconnectInterval time.Duration
	Logger            *zap.Logger
	Config            AmqpConfig
}

// getDefaultConnectionOptions describes the options that will be used when a value isn't provided
func getDefaultConnectionOptions() ConnectionOptions {
	return ConnectionOptions{
		ReconnectInterval: time.Second * 5,
		Logger:            zap.L(),
		Config:            AmqpConfig{},
	}
}

// WithConnectionOptionsReconnectInterval sets the reconnection interval
func WithConnectionOptionsReconnectInterval(interval time.Duration) func(options *ConnectionOptions) {
	return func(options *ConnectionOptions) {
		options.ReconnectInterval = interval
	}
}

// WithConnectionOptionsLogging sets logging to true on the consumer options
// and sets the
func WithConnectionOptionsLogging(options *ConnectionOptions) {
	options.Logger = zap.L()
}

// WithConnectionOptionsLogger sets logging to true on the consumer options
// and sets the
func WithConnectionOptionsLogger(log *zap.Logger) func(options *ConnectionOptions) {
	return func(options *ConnectionOptions) {
		options.Logger = log
	}
}

// WithConnectionOptionsConfig sets the AmqpConfig used in the connection
func WithConnectionOptionsConfig(cfg AmqpConfig) func(options *ConnectionOptions) {
	return func(options *ConnectionOptions) {
		options.Config = cfg
	}
}
