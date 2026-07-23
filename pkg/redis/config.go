package redis

type Config struct {
	Cluster       bool   `envconfig:"REDIS_CLUSTER" default:"false"`
	Address       string `envconfig:"REDIS_ADDRESS" default:"localhost:6379"`
	Tls           bool   `envconfig:"REDIS_TLS" default:"false"`
	TlsSkipVerify bool   `envconfig:"REDIS_TLS_SKIP_VERIFY" default:"false"`
	MinIdleConn   int    `envconfig:"REDIS_MIN_IDLE_CONN" default:"20"`
	PoolSize      int    `envconfig:"REDIS_POOL_SIZE" default:"100"`
	PoolTimeout   int    `envconfig:"REDIS_POOL_TIMEOUT" default:"30"`
	Username      string `envconfig:"REDIS_USERNAME" default:"default"`
	Password      string `envconfig:"REDIS_PASSWORD" default:"password"`
	DB            int    `envconfig:"REDIS_DB" default:"0"`
	Tracing       bool   `envconfig:"REDIS_TRACING" default:"false"`
	Metrics       bool   `envconfig:"REDIS_METRICS" default:"false"`
}
