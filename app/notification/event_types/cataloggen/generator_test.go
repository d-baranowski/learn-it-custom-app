package cataloggen

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGeneratedNotificationEventTypeSpecsReflectsPaymentDuePayload(t *testing.T) {
	specs, err := GeneratedNotificationEventTypeSpecs(nil)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 1 {
		t.Fatalf("expected 1 spec, got %d", len(specs))
	}

	if specs[0].Version != 1 {
		t.Fatalf("expected version 1, got %d", specs[0].Version)
	}

	expected := map[string]bool{
		"sessions":        false,
		"therapist.fullName": false,
	}

	for _, field := range specs[0].PayloadFields {
		if _, ok := expected[field.Path]; ok {
			expected[field.Path] = true
		}
	}

	for path, seen := range expected {
		if !seen {
			t.Fatalf("expected payload field %q", path)
		}
	}
}

func TestGeneratedNotificationEventTypeSpecsNonBreakingAdditionOverwritesLatest(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid Updated",
	Description: "updated description",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	ID   string `+"`json:\"id\"`"+`
	Name string `+"`json:\"name\"`"+`
}
`)

	existing := []GeneratedEventTypeSpec{{
		Key:         "session.unpaid",
		Version:     1,
		DisplayName: "Session Unpaid",
		PayloadFields: []GeneratedEventPayloadField{
			{Path: "session.id", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
		},
	}}

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(existing, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 1 {
		t.Fatalf("expected 1 spec, got %d", len(specs))
	}

	if specs[0].Version != 1 {
		t.Fatalf("expected version 1, got %d", specs[0].Version)
	}

	if specs[0].DisplayName != "Session Unpaid Updated" {
		t.Fatalf("expected updated display name, got %q", specs[0].DisplayName)
	}

	assertFieldPaths(t, specs[0].PayloadFields, "session.id", "session.name")
}

func TestGeneratedNotificationEventTypeSpecsDeletionCreatesNewVersion(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	ID string `+"`json:\"id\"`"+`
}
`)

	existing := []GeneratedEventTypeSpec{{
		Key:         "session.unpaid",
		Version:     1,
		DisplayName: "Session Unpaid",
		PayloadFields: []GeneratedEventPayloadField{
			{Path: "session.id", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
			{Path: "session.name", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
		},
	}}

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(existing, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 2 {
		t.Fatalf("expected 2 specs, got %d", len(specs))
	}

	if specs[1].Version != 2 {
		t.Fatalf("expected version 2, got %d", specs[1].Version)
	}

	assertFieldPaths(t, specs[1].PayloadFields, "session.id")
}

func TestGeneratedNotificationEventTypeSpecsRenameCreatesNewVersion(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	Identifier string `+"`json:\"identifier\"`"+`
}
`)

	existing := []GeneratedEventTypeSpec{{
		Key:         "session.unpaid",
		Version:     1,
		DisplayName: "Session Unpaid",
		PayloadFields: []GeneratedEventPayloadField{
			{Path: "session.id", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
		},
	}}

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(existing, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 2 {
		t.Fatalf("expected 2 specs, got %d", len(specs))
	}

	if specs[1].Version != 2 {
		t.Fatalf("expected version 2, got %d", specs[1].Version)
	}

	assertFieldPaths(t, specs[1].PayloadFields, "session.identifier")
}

func TestGeneratedNotificationEventTypeSpecsTypeAndRequirednessChangesOverwriteLatest(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	ID *int `+"`json:\"id\"`"+`
}
`)

	existing := []GeneratedEventTypeSpec{{
		Key:         "session.unpaid",
		Version:     1,
		DisplayName: "Session Unpaid",
		PayloadFields: []GeneratedEventPayloadField{
			{Path: "session.id", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
		},
	}}

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(existing, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 1 {
		t.Fatalf("expected 1 spec, got %d", len(specs))
	}

	if specs[0].Version != 1 {
		t.Fatalf("expected version 1, got %d", specs[0].Version)
	}

	if len(specs[0].PayloadFields) != 1 {
		t.Fatalf("expected 1 payload field, got %d", len(specs[0].PayloadFields))
	}

	field := specs[0].PayloadFields[0]
	if field.Type != GeneratedNotificationPayloadFieldTypeNumber {
		t.Fatalf("expected number field type, got %d", field.Type)
	}
	if field.Required {
		t.Fatalf("expected field to become optional")
	}
}

func TestGeneratedNotificationEventTypeSpecsArrayFieldsUseArrayType(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	IDs      []string          `+"`json:\"ids\"`"+`
	Metadata map[string]string `+"`json:\"metadata\"`"+`
}
`)

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(nil, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 1 {
		t.Fatalf("expected 1 spec, got %d", len(specs))
	}

	assertFieldPaths(t, specs[0].PayloadFields, "session.ids", "session.metadata")

	fieldTypes := map[string]int{}
	for _, field := range specs[0].PayloadFields {
		fieldTypes[field.Path] = field.Type
	}

	if fieldTypes["session.ids"] != GeneratedNotificationPayloadFieldTypeArray {
		t.Fatalf("expected session.ids to be ARRAY, got %d", fieldTypes["session.ids"])
	}
	if fieldTypes["session.metadata"] != GeneratedNotificationPayloadFieldTypeJSON {
		t.Fatalf("expected session.metadata to be JSON, got %d", fieldTypes["session.metadata"])
	}
}

func TestGeneratedNotificationEventTypeSpecsBreakingChangePreservesHistory(t *testing.T) {
	sourceDir := writeTestEventSource(t, `package testevents

type EventDefinition struct {
	Key         string
	DisplayName string
	Description string
	Payload     any
}

var SessionUnpaidEvent = EventDefinition{
	Key:         "session.unpaid",
	DisplayName: "Session Unpaid",
	Payload: SessionUnpaidPayload{},
}

type SessionUnpaidPayload struct {
	Session SessionPayload `+"`json:\"session\"`"+`
}

type SessionPayload struct {
	Identifier string `+"`json:\"identifier\"`"+`
}
`)

	existing := []GeneratedEventTypeSpec{
		{
			Key:         "session.unpaid",
			Version:     1,
			DisplayName: "Session Unpaid v1",
			PayloadFields: []GeneratedEventPayloadField{
				{Path: "session.legacyId", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
			},
		},
		{
			Key:         "session.unpaid",
			Version:     2,
			DisplayName: "Session Unpaid v2",
			PayloadFields: []GeneratedEventPayloadField{
				{Path: "session.id", Type: GeneratedNotificationPayloadFieldTypeString, Required: true},
			},
		},
	}

	specs, err := GeneratedNotificationEventTypeSpecsFromSource(existing, sourceDir)
	if err != nil {
		t.Fatalf("generate specs: %v", err)
	}

	if len(specs) != 3 {
		t.Fatalf("expected 3 specs, got %d", len(specs))
	}

	if specs[0].Version != 1 || specs[1].Version != 2 || specs[2].Version != 3 {
		t.Fatalf("expected versions 1, 2, 3; got %d, %d, %d", specs[0].Version, specs[1].Version, specs[2].Version)
	}

	assertFieldPaths(t, specs[0].PayloadFields, "session.legacyId")
	assertFieldPaths(t, specs[1].PayloadFields, "session.id")
	assertFieldPaths(t, specs[2].PayloadFields, "session.identifier")
}

func writeTestEventSource(t *testing.T, fileContent string) string {
	t.Helper()

	sourceDir := t.TempDir()
	filePath := filepath.Join(sourceDir, "event.go")
	if err := os.WriteFile(filePath, []byte(fileContent), 0o644); err != nil {
		t.Fatalf("write test event source: %v", err)
	}

	return sourceDir
}

func assertFieldPaths(t *testing.T, fields []GeneratedEventPayloadField, expectedPaths ...string) {
	t.Helper()

	if len(fields) != len(expectedPaths) {
		t.Fatalf("expected %d payload fields, got %d", len(expectedPaths), len(fields))
	}

	expected := make(map[string]bool, len(expectedPaths))
	for _, path := range expectedPaths {
		expected[path] = false
	}

	for _, field := range fields {
		seen, ok := expected[field.Path]
		if !ok {
			t.Fatalf("unexpected payload field %q", field.Path)
		}
		if seen {
			t.Fatalf("duplicate payload field %q", field.Path)
		}
		expected[field.Path] = true
	}

	for path, seen := range expected {
		if !seen {
			t.Fatalf("expected payload field %q", path)
		}
	}
}
