package redis

import (
	"github.com/redis/go-redis/v9"
	"go.uber.org/fx"
)

func Provider(config *Config) (redis.UniversalClient, error) {
	return NewUniversalClient(config)
}

var Module = fx.Module("redis",
	fx.Provide(Provider),
)
