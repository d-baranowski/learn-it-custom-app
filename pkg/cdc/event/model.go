package event

import (
	"fmt"
	"pkg/unix"
)

type CdcAction string

func (a CdcAction) String() string {
	return string(a)
}

const (
	Insert CdcAction = "INSERT"
	Update CdcAction = "UPDATE"
	Delete CdcAction = "DELETE"
)

type CdcEvent[T any] struct {
	Timestamp unix.Timestamp `json:"timestamp"`
	Schema    string         `json:"schema"`
	Table     string         `json:"table"`
	Action    CdcAction      `json:"action"`
	ID        string         `json:"id"`
	Old       *T             `json:"old"`
	New       *T             `json:"new"`
}

func (e CdcEvent[T]) String() string {
	return fmt.Sprintf("%s.%s %s %s", e.Schema, e.Table, e.Action, e.ID)
}
