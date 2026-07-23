package rabbitmq

import (
	"fmt"
	"sync"
	"time"
)

var connectionPool *ConnectionPool

func AcquirePoolConnection() (*Connection, error) {
	return connectionPool.Acquire()
}

func ReleasePoolConnection(conn *Connection) {
	connectionPool.Release(conn)
}

type ConnectionPool struct {
	connections map[string]*Connection
	channels    map[string]int
	mutex       sync.Mutex
}

func NewConnectionPool(config *Config) (*ConnectionPool, error) {
	pool := &ConnectionPool{
		connections: make(map[string]*Connection, config.PoolSize),
		channels:    make(map[string]int, config.PoolSize),
	}

	cfg := AmqpConfig{
		Heartbeat: 0,
	}

	if config.Heartbeat > 0 {
		cfg.Heartbeat = time.Duration(config.Heartbeat) * time.Second
	}

	for i := 0; i < config.PoolSize; i++ {
		conn, err := NewConnection(config.ConnectionString(), WithConnectionOptionsConfig(cfg))
		if err != nil {
			return nil, err
		}
		pool.connections[conn.id] = conn
		pool.channels[conn.id] = 0
	}

	connectionPool = pool

	return pool, nil
}

func (pool *ConnectionPool) Acquire() (*Connection, error) {
	pool.mutex.Lock()
	defer pool.mutex.Unlock()

	connID := ""
	minChannel := 0

	for id, load := range pool.channels {
		if connID == "" || load < minChannel {
			connID = id
			minChannel = load
		}
	}

	if connID == "" {
		return nil, fmt.Errorf("no available connection")
	}

	pool.channels[connID]++

	return pool.connections[connID], nil
}

func (pool *ConnectionPool) Release(conn *Connection) {
	pool.mutex.Lock()
	defer pool.mutex.Unlock()

	if conn == nil {
		return
	}

	if load, ok := pool.channels[conn.id]; !ok {
		return
	} else {
		if load <= 1 {
			delete(pool.channels, conn.id)
			return
		}
	}

	pool.channels[conn.id]--
}

func (pool *ConnectionPool) ReleaseID(connID string) {
	pool.mutex.Lock()
	defer pool.mutex.Unlock()

	if connID == "" {
		return
	}

	if load, ok := pool.channels[connID]; !ok {
		return
	} else {
		if load <= 1 {
			delete(pool.channels, connID)
			return
		}
	}

	pool.channels[connID]--
}
