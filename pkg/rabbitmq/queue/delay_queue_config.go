package queue

import (
	"fmt"
)

type DelayQueueConfig struct {
	Init bool

	// Levels is the number of levels in the delay queue, default = MaxDelay of 262,144 seconds
	//Levels int `envconfig:"RABBITMQ_DQ_LEVELS" default:"18"`

	// If MaxDelay is set it will override the Levels setting and calculate the levels
	MaxDelay int

	//ExchangeOpts rabbitmq.Table `envconfig:"RABBITMQ_DQ_EXCHANGE_OPTS"`

	Prefix string

	//ExchangePrefix   string `envconfig:"RABBITMQ_DQ_EXCHANGE_PREFIX" default:"dq"`
	//QueuePrefix      string `envconfig:"RABBITMQ_DQ_QUEUE_PREFIX" default:"dq"`
	//StartQueuePrefix string `envconfig:"RABBITMQ_DQ_START_QUEUE_PREFIX" default:"dq-start"`
	//InputExchange    string `envconfig:"RABBITMQ_DQ_INPUT_EXCHANGE" default:"dq-input"`
	//OutputExchange   string `envconfig:"RABBITMQ_DQ_OUTPUT_EXCHANGE" default:"dq-output"`

	//CancelledStream string `envconfig:"RABBITMQ_DQ_CANCELLED_STREAM" default:"dq-cancelled"`

	// CancelledStreamMaxAge is used in V1 of the delay queue to set the age of the stream
	// If CancelledStreamMaxAge is zero the age will be set to MaxDelay + 1 minute
	CancelledStreamMaxAge int

	//DispatcherExchange string `envconfig:"RABBITMQ_DQ_DISPATCH_EXCHANGE" default:"dq-dispatcher"`
	//DispatcherQueue string `envconfig:"RABBITMQ_DQ_DISPATCH_QUEUE" default:"dq-dispatcher"`

	//DispatchedStream string `envconfig:"RABBITMQ_DQ_DISPATCHED_STREAM" default:"dq-dispatched"`

	// DispatchedStreamMaxAge is used in V1 of the delay queue to set the age of the stream
	// If DispatchedStreamMaxAge is zero the age will be set to MaxDelay + 1 minute
	DispatchedStreamMaxAge int
}

func (c *DelayQueueConfig) StartQueuePrefix() string {
	if c.Prefix == "" {
		return "dq-start"
	}
	return fmt.Sprintf("%s-dq-start", c.Prefix)
}

func (c *DelayQueueConfig) InputExchange() string {
	if c.Prefix == "" {
		return "dq-input"
	}
	return fmt.Sprintf("%s-dq-input", c.Prefix)
}

func (c *DelayQueueConfig) OutputExchange() string {
	if c.Prefix == "" {
		return "dq-output"
	}
	return fmt.Sprintf("%s-dq-output", c.Prefix)
}

func (c *DelayQueueConfig) CancelledStream() string {
	if c.Prefix == "" {
		return "dq-cancelled"
	}
	return fmt.Sprintf("%s-dq-cancelled", c.Prefix)
}

func (c *DelayQueueConfig) DispatcherExchange() string {
	if c.Prefix == "" {
		return "dq-dispatcher"
	}
	return fmt.Sprintf("%s-dq-dispatcher", c.Prefix)
}

func (c *DelayQueueConfig) DispatcherQueue() string {
	if c.Prefix == "" {
		return "dq-dispatcher"
	}
	return fmt.Sprintf("%s-dq-dispatcher", c.Prefix)
}

func (c *DelayQueueConfig) DispatchedStream() string {
	if c.Prefix == "" {
		return "dq-dispatched"
	}
	return fmt.Sprintf("%s-dq-dispatched", c.Prefix)
}

var (
	DefaultDelayQueueConfig = &DelayQueueConfig{
		//Levels: 18, // 262,144 seconds
		MaxDelay: 48 * 60 * 60, // 48 hours
		//ExchangeOpts: rabbitmq.Table{"durable": true},
		Prefix: "dq",
		//ExchangePrefix:         "dq",
		//QueuePrefix:            "dq",
		//StartQueuePrefix:       "dq-start",
		//InputExchange:          "dq-input",
		//OutputExchange:         "dq-output",
		//CancelledStream:        "dq-cancelled",
		CancelledStreamMaxAge: 0,
		//DispatcherExchange:     "dq-dispatcher",
		//DispatcherQueue: "dq-dispatcher",
		//DispatchedStream:       "dq-dispatched",
		DispatchedStreamMaxAge: 0,
	}
)
