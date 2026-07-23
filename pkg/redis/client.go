package redis

import (
	"context"
	"crypto/tls"
	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"strings"
	"time"
)

type Client interface {
	redis.UniversalClient
	GetLock(ctx context.Context, key string, ttl int) (bool, error)
	ReleaseLock(ctx context.Context, key string) error
}

type client struct {
	redis.UniversalClient
}

func NewUniversalClient(config *Config) (redis.UniversalClient, error) {
	var tlsConfig *tls.Config
	if config.Tls {
		tlsConfig = &tls.Config{
			InsecureSkipVerify: config.TlsSkipVerify,
		}
	}

	if config.Cluster {
		opts := &redis.ClusterOptions{
			Addrs:        strings.Split(config.Address, ","),
			Username:     config.Username,
			Password:     config.Password,
			TLSConfig:    tlsConfig,
			MinIdleConns: config.MinIdleConn,
			PoolSize:     config.PoolSize,
			PoolTimeout:  time.Duration(config.PoolTimeout) * time.Second,
		}

		rdb := redis.NewClusterClient(opts)

		err := rdb.Ping(context.Background()).Err()
		if err != nil {
			return nil, err
		}

		if config.Tracing {
			if err := redisotel.InstrumentTracing(rdb); err != nil {
				return nil, err
			}
		}

		if config.Metrics {
			if err := redisotel.InstrumentMetrics(rdb); err != nil {
				return nil, err
			}
		}

		return rdb, nil
	}

	opts := &redis.Options{
		Addr:         config.Address,
		DB:           config.DB,
		Username:     config.Username,
		Password:     config.Password,
		TLSConfig:    tlsConfig,
		MinIdleConns: config.MinIdleConn,
		PoolSize:     config.PoolSize,
		PoolTimeout:  time.Duration(config.PoolTimeout) * time.Second,
	}

	rdb := redis.NewClient(opts)

	if config.Tracing {
		if err := redisotel.InstrumentTracing(rdb); err != nil {
			return nil, err
		}
	}

	if config.Metrics {
		if err := redisotel.InstrumentMetrics(rdb); err != nil {
			return nil, err
		}
	}

	return rdb, nil
}

func NewClient(config *Config) (Client, error) {
	opts := &redis.Options{
		Addr:     config.Address,
		DB:       config.DB,
		Username: config.Username,
		Password: config.Password,
	}

	rdb := redis.NewClient(opts)

	if config.Tracing {
		if err := redisotel.InstrumentTracing(rdb); err != nil {
			return nil, err
		}
	}

	if config.Metrics {
		if err := redisotel.InstrumentMetrics(rdb); err != nil {
			return nil, err
		}
	}

	err := rdb.Ping(context.Background()).Err()
	if err != nil {
		return nil, err
	}

	return &client{rdb}, nil
}

func (c *client) GetLock(ctx context.Context, key string, ttl int) (bool, error) {
	return c.SetNX(ctx, key, 1, time.Duration(ttl)*time.Second).Result()
}

func (c *client) ReleaseLock(ctx context.Context, key string) error {
	return c.Del(ctx, key).Err()
}
