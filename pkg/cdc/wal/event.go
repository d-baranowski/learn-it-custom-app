package wal

import (
	"pkg/cdc/event"
	"time"
)

type Event struct {
	ID        string          `json:"id"`
	Schema    string          `json:"schema"`
	Table     string          `json:"table"`
	Action    event.CdcAction `json:"action"`
	New       map[string]any  `json:"new_data"`
	Old       map[string]any  `json:"old_data"`
	EventTime time.Time       `json:"event_time"`
}

func (e *Event) Deleting() bool {
	return e.Action == event.Delete
}

func (e *Event) Inserting() bool {
	return e.Action == event.Insert
}

func (e *Event) Updating() bool {
	return e.Action == event.Update
}

func (e *Event) Topic() string {
	return e.Schema + "." + e.Table + "." + e.Action.String()
}
