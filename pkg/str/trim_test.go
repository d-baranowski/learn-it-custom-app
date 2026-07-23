package str

import "testing"

func TestTrimToNil(t *testing.T) {
	if got := TrimToNil("   "); got != nil {
		t.Fatalf("expected nil for whitespace, got %q", *got)
	}
	if got := TrimToNil("  value  "); got == nil || *got != "value" {
		t.Fatalf("expected trimmed value, got %#v", got)
	}
}

func TestTrimPtrToNil(t *testing.T) {
	if got := TrimPtrToNil(nil); got != nil {
		t.Fatalf("expected nil for nil pointer")
	}
	whitespace := "  "
	if got := TrimPtrToNil(&whitespace); got != nil {
		t.Fatalf("expected nil for whitespace pointer, got %q", *got)
	}
	value := "  value  "
	if got := TrimPtrToNil(&value); got == nil || *got != "value" {
		t.Fatalf("expected trimmed value, got %#v", got)
	}
}
