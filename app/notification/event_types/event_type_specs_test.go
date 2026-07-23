package event_types

import "testing"

func TestEventTypeSpecsLoadsEmbeddedCatalog(t *testing.T) {
	specs := EventTypeSpecs()
	if len(specs) == 0 {
		t.Fatal("expected embedded event type catalog to be non-empty")
	}

	spec, ok := LatestEventTypeSpecByKey("session.unpaid")
	if !ok {
		t.Fatal("expected session.unpaid to exist in event type catalog")
	}

	if spec.Version <= 0 {
		t.Fatalf("expected session.unpaid version to be positive, got %d", spec.Version)
	}

	if spec.DisplayName != "Session Unpaid" {
		t.Fatalf("unexpected display name: %q", spec.DisplayName)
	}
}

func TestLoadEventTypeSpecsRejectsInvalidEntries(t *testing.T) {
	_, err := loadEventTypeSpecs([]byte(`[{"key":"","version":1,"displayName":"x","payloadFields":[]}]`))
	if err == nil {
		t.Fatal("expected invalid catalog entry to return an error")
	}
}
