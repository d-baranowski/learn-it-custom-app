package api

import "fmt"

type Config struct {
	Host         string   `envconfig:"API_HOST" default:"0.0.0.0"`
	Port         int      `envconfig:"API_PORT" default:"9001"`
	Cors         []string `envconfig:"API_CORS" default:"*"`
	LogLevel     string   `envconfig:"API_LOG_LEVEL" default:"info"`
	TrustedCIDRs []string `envconfig:"API_TRUSTED_CIDRS" default:""`
	Permissions  bool     `envconfig:"API_PERMISSIONS" default:"true"`
}

func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}
