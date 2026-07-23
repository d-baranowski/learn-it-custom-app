package rabbitmq

import "fmt"

type Config struct {
	PoolSize      int    `envconfig:"RABBITMQ_POOL_SIZE" default:"10"`
	Host          string `envconfig:"RABBITMQ_HOST" default:"localhost"`
	Port          int    `envconfig:"RABBITMQ_PORT" default:"5672"`
	ApiPort       int    `envconfig:"RABBITMQ_API_PORT" default:"15672"`
	StreamPort    int    `envconfig:"RABBITMQ_STREAM_PORT" default:"5552"`
	Username      string `envconfig:"RABBITMQ_USER" default:"guest"`
	Password      string `envconfig:"RABBITMQ_PASSWORD" default:"guest"`
	Heartbeat     int    `envconfig:"RABBITMQ_HEARTBEAT" default:"10"`
	VHost         string `envconfig:"RABBITMQ_VHOST" default:"/"`
	TLS           bool   `envconfig:"RABBITMQ_TLS" default:"false"`
	TLSSkipVerify bool   `envconfig:"RABBITMQ_TLS_SKIP_VERIFY" default:"false"`

	// If enabled, will apply an address resolver to the connection
	// use if rabbit is running behind a load balance to
	// https://github.com/rabbitmq/rabbitmq-stream-go-client/blob/main/examples/proxy/proxy.go
	UseStreamAddressResolver bool `envconfig:"RABBITMQ_USE_STREAM_ADDRESS_RESOLVER" default:"false"`

	//Tracing  bool   `envconfig:"RABBITMQ_TRACING" default:"false"`
}

func (c *Config) ConnectionString() string {
	// check if vhost has leading slash
	vHost := c.VHost
	if vHost[0] != '/' {
		vHost = "/" + c.VHost
	}

	if c.TLS {
		return fmt.Sprintf("amqps://%s:%s@%s:%d%s", c.Username, c.Password, c.Host, c.Port, vHost)
	}
	return fmt.Sprintf("amqp://%s:%s@%s:%d%s", c.Username, c.Password, c.Host, c.Port, vHost)
}

func (c *Config) ApiAddress() string {
	return fmt.Sprintf("http://%s:%d", c.Host, c.ApiPort)
}
