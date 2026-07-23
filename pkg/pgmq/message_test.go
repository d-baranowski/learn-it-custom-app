package pgmq

import (
	"encoding/json"
	"testing"
)

func TestEnvelopeSerialization(t *testing.T) {
	payload := map[string]any{
		"session_id": "abc123",
		"amount":     42.5,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	envelope := Envelope{
		RoutingKey:  "session.created",
		PublisherID: "core",
		PublishedAt: 1719000000000,
		Payload:     payloadBytes,
	}

	bytes, err := json.Marshal(envelope)
	if err != nil {
		t.Fatalf("marshal envelope: %v", err)
	}

	var decoded Envelope
	if err := json.Unmarshal(bytes, &decoded); err != nil {
		t.Fatalf("unmarshal envelope: %v", err)
	}

	if decoded.RoutingKey != "session.created" {
		t.Errorf("routing_key = %q, want %q", decoded.RoutingKey, "session.created")
	}
	if decoded.PublisherID != "core" {
		t.Errorf("publisher_id = %q, want %q", decoded.PublisherID, "core")
	}
	if decoded.PublishedAt != 1719000000000 {
		t.Errorf("published_at = %d, want %d", decoded.PublishedAt, 1719000000000)
	}

	var decodedPayload map[string]any
	if err := json.Unmarshal(decoded.Payload, &decodedPayload); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}
	if decodedPayload["session_id"] != "abc123" {
		t.Errorf("payload.session_id = %v, want %q", decodedPayload["session_id"], "abc123")
	}
}

func TestEnvelopePayloadIsRawJSON(t *testing.T) {
	raw := json.RawMessage(`{"nested":{"key":"value"}}`)
	envelope := Envelope{
		RoutingKey:  "test.event",
		PublisherID: "test",
		PublishedAt: 1,
		Payload:     raw,
	}

	bytes, err := json.Marshal(envelope)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var m map[string]json.RawMessage
	if err := json.Unmarshal(bytes, &m); err != nil {
		t.Fatalf("unmarshal to map: %v", err)
	}

	payloadStr := string(m["payload"])
	if payloadStr != `{"nested":{"key":"value"}}` {
		t.Errorf("payload not preserved as raw JSON: got %s", payloadStr)
	}
}
