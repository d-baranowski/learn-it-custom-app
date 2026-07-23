package transform

import (
	"reflect"
	"testing"

	coreevents "app/core/events"
	"pkg/cdc/wal"
)

func TestSessionUpdateRoutingKeys(t *testing.T) {
	tests := []struct {
		name string
		old  map[string]any
		new  map[string]any
		want []string
	}{
		{
			name: "paid_at nil->set emits session.updated and session.paid",
			old:  map[string]any{"paid_at": nil},
			new:  map[string]any{"paid_at": int64(1783669800000)},
			want: []string{coreevents.SessionUpdated, coreevents.SessionPaid},
		},
		{
			name: "already paid, another update is a plain update",
			old:  map[string]any{"paid_at": int64(1783669800000)},
			new:  map[string]any{"paid_at": int64(1783669800000)},
			want: []string{coreevents.SessionUpdated},
		},
		{
			name: "cancelled_at nil->set is cancel-only",
			old:  map[string]any{"cancelled_at": nil},
			new:  map[string]any{"cancelled_at": int64(1783669800000)},
			want: []string{coreevents.SessionCancelled},
		},
		{
			name: "plain field change is a plain update",
			old:  map[string]any{"start_time": "10:00"},
			new:  map[string]any{"start_time": "11:00"},
			want: []string{coreevents.SessionUpdated},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sessionUpdateRoutingKeys(wal.Event{Old: tt.old, New: tt.new})
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("routing keys = %v, want %v", got, tt.want)
			}
			// Guard the split: the paid path must NOT re-emit payment.received.
			for _, k := range got {
				if k == "payment.received" {
					t.Fatalf("transformer must not emit payment.received; got %v", got)
				}
			}
		})
	}
}
