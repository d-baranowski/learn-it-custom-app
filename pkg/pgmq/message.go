package pgmq

import (
	"encoding/json"
	"time"
)

type Envelope struct {
	RoutingKey  string          `json:"routing_key"`
	PublisherID string          `json:"publisher_id"`
	PublishedAt int64           `json:"published_at"`
	Payload     json.RawMessage `json:"payload"`
}

type QueueMessage struct {
	MsgID      int64
	ReadCount  int32
	EnqueuedAt time.Time
	VT         time.Time
	Message    Envelope
}
