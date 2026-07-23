package event_types

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"
)

const (
	NotificationPayloadFieldTypeUnspecified = 0
	NotificationPayloadFieldTypeString      = 1
	NotificationPayloadFieldTypeNumber      = 2
	NotificationPayloadFieldTypeBoolean     = 3
	NotificationPayloadFieldTypeDate        = 4
	NotificationPayloadFieldTypeDateTime    = 5
	NotificationPayloadFieldTypeJSON        = 6
	NotificationPayloadFieldTypeArray       = 7
)

type EventPayloadField struct {
	Path        string  `json:"path"`
	Type        int     `json:"type"`
	Required    bool    `json:"required"`
	Description *string `json:"description,omitempty"`
}

type EventTypeSpec struct {
	Key           string              `json:"key"`
	Version       int                 `json:"version"`
	DisplayName   string              `json:"displayName"`
	Description   *string             `json:"description,omitempty"`
	PayloadFields []EventPayloadField `json:"payloadFields"`
}

type persistedEventTypeSpec struct {
	Version       int                 `json:"version"`
	DisplayName   string              `json:"displayName"`
	Description   *string             `json:"description,omitempty"`
	PayloadFields []EventPayloadField `json:"payloadFields"`
}

//go:embed event_types.json
var eventTypesJSON []byte

var (
	eventTypeSpecsOnce sync.Once
	eventTypeSpecs     []EventTypeSpec
	eventTypeSpecsErr  error
)

func EventTypeSpecID(key string, version int) string {
	return fmt.Sprintf("%s@v%d", strings.TrimSpace(key), version)
}

func EventTypeIDPrefix(key string) string {
	return strings.TrimSpace(key) + "@v"
}

func EventTypeSpecByID(id string) (EventTypeSpec, bool) {
	for _, spec := range EventTypeSpecs() {
		if EventTypeSpecID(spec.Key, spec.Version) == strings.TrimSpace(id) {
			return spec, true
		}
	}

	return EventTypeSpec{}, false
}

func EventTypeSpecByKey(key string) (EventTypeSpec, bool) {
	return LatestEventTypeSpecByKey(key)
}

func LatestEventTypeSpecByKey(key string) (EventTypeSpec, bool) {
	trimmedKey := strings.TrimSpace(key)
	var latest EventTypeSpec
	found := false

	for _, spec := range EventTypeSpecs() {
		if strings.TrimSpace(spec.Key) != trimmedKey {
			continue
		}
		if !found || spec.Version > latest.Version {
			latest = spec
			found = true
		}
	}

	return latest, found
}

func LatestEventTypeSpecs() []EventTypeSpec {
	latestByKey := map[string]EventTypeSpec{}

	for _, spec := range EventTypeSpecs() {
		key := strings.TrimSpace(spec.Key)
		existing, exists := latestByKey[key]
		if !exists || spec.Version > existing.Version {
			latestByKey[key] = spec
		}
	}

	result := make([]EventTypeSpec, 0, len(latestByKey))
	for _, spec := range latestByKey {
		result = append(result, spec)
	}

	sort.Slice(result, func(i, j int) bool {
		left := strings.TrimSpace(result[i].DisplayName)
		right := strings.TrimSpace(result[j].DisplayName)
		if left == right {
			return strings.TrimSpace(result[i].Key) < strings.TrimSpace(result[j].Key)
		}
		return left < right
	})

	return result
}

func EventTypeSpecs() []EventTypeSpec {
	eventTypeSpecsOnce.Do(func() {
		eventTypeSpecs, eventTypeSpecsErr = loadEventTypeSpecs(eventTypesJSON)
	})
	if eventTypeSpecsErr != nil {
		panic(fmt.Errorf("load notification event type catalog: %w", eventTypeSpecsErr))
	}

	result := make([]EventTypeSpec, len(eventTypeSpecs))
	copy(result, eventTypeSpecs)

	return result
}

func loadEventTypeSpecs(raw []byte) ([]EventTypeSpec, error) {
	if len(raw) == 0 {
		return nil, nil
	}

	var persisted map[string][]persistedEventTypeSpec
	if err := json.Unmarshal(raw, &persisted); err != nil {
		return nil, err
	}

	var specs []EventTypeSpec
	for key, entries := range persisted {
		for _, entry := range entries {
			specs = append(specs, EventTypeSpec{
				Key:           key,
				Version:       entry.Version,
				DisplayName:   entry.DisplayName,
				Description:   entry.Description,
				PayloadFields: entry.PayloadFields,
			})
		}
	}

	for index := range specs {
		specs[index].Key = strings.TrimSpace(specs[index].Key)
		specs[index].DisplayName = strings.TrimSpace(specs[index].DisplayName)
		if specs[index].Key == "" {
			return nil, fmt.Errorf("event type at index %d has empty key", index)
		}
		if specs[index].Version <= 0 {
			return nil, fmt.Errorf("event type %q has invalid version %d", specs[index].Key, specs[index].Version)
		}
		if specs[index].DisplayName == "" {
			return nil, fmt.Errorf("event type %q has empty displayName", specs[index].Key)
		}

		for fieldIndex := range specs[index].PayloadFields {
			specs[index].PayloadFields[fieldIndex].Path = strings.TrimSpace(specs[index].PayloadFields[fieldIndex].Path)
			if specs[index].PayloadFields[fieldIndex].Path == "" {
				return nil, fmt.Errorf("event type %q has payload field with empty path at index %d", specs[index].Key, fieldIndex)
			}
		}
	}

	return specs, nil
}

func PayloadToMap(payload any) (map[string]any, error) {
	bytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	var result map[string]any
	if err := json.Unmarshal(bytes, &result); err != nil {
		return nil, err
	}

	return result, nil
}
