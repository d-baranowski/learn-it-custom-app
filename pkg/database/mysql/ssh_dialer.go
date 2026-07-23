package mysql

import (
	"context"
	"golang.org/x/crypto/ssh"
	"net"
)

type Dialer struct {
	client *ssh.Client
}

func (v *Dialer) Dial(_ context.Context, address string) (net.Conn, error) {
	return v.client.Dial("tcp", address)
}
