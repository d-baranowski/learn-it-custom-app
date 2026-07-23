package wal

import "errors"

// Variable with connection errors.
var (
	errReplConnectionIsLost = errors.New("replication connection to postgres is lost")
	errConnectionIsLost     = errors.New("db connection to postgres is lost")
	errMessageLost          = errors.New("messages are lost")
	errEmptyWALMessage      = errors.New("empty WAL message")
	errUnknownMessageType   = errors.New("unknown message type")
	errRelationNotFound     = errors.New("relation not found")
)

type listenerErr struct {
	Caller string
	Err    error
}

func NewListenerError(caller string, err error) *listenerErr {
	return &listenerErr{Caller: caller, Err: err}
}

func (e *listenerErr) Error() string {
	return e.Caller + ": " + e.Err.Error()
}
