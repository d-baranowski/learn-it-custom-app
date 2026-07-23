package mysql

import (
	"context"
	"fmt"
	"go.uber.org/zap"
	"golang.org/x/crypto/ssh"
	"net"
	"os"
	"sync"
	"time"
)

type SSHConnection struct {
	config         *ssh.ClientConfig
	address        string
	client         *ssh.Client
	mu             sync.Mutex
	stopReconnect  chan struct{}
	reconnectDelay time.Duration
}

func NewSSHConnection(username, host string, port int, privateKeyFile string, reconnectDelay time.Duration) (*SSHConnection, error) {
	key, err := os.ReadFile(privateKeyFile)
	if err != nil {
		return nil, err
	}

	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, err
	}

	config := &ssh.ClientConfig{
		User:            username,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
	}

	address := fmt.Sprintf("%s:%d", host, port)

	return &SSHConnection{
		config:         config,
		address:        address,
		reconnectDelay: reconnectDelay,
		stopReconnect:  make(chan struct{}),
	}, nil
}

func (c *SSHConnection) Start() error {
	if err := c.connect(); err != nil {
		return err
	}

	go c.keepAlive()

	return nil
}

func (c *SSHConnection) connect() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	client, err := ssh.Dial("tcp", c.address, c.config)
	if err != nil {
		return err
	}

	c.client = client
	zap.L().Info("ssh tunnel established", zap.String("addr", c.address))
	return nil
}

func (c *SSHConnection) keepAlive() {
	for {
		select {
		case <-time.After(c.reconnectDelay):
			c.mu.Lock()
			client := c.client
			c.mu.Unlock()
			if client != nil {
				_, _, err := client.SendRequest("keepalive@openssh.com", true, nil)
				if err == nil {
					continue
				}
				zap.L().Error("ssh connection lost, reconnecting...")
				client.Close()
			}
			c.connect()
		case <-c.stopReconnect:
			return
		}
	}
}

func (c *SSHConnection) Stop() {
	close(c.stopReconnect)
	c.mu.Lock()
	if c.client != nil {
		c.client.Close()
	}
	c.mu.Unlock()
}

func (c *SSHConnection) Dial(_ context.Context, address string) (net.Conn, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	return c.client.Dial("tcp", address)
}
