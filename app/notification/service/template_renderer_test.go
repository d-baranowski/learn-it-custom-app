package service

import (
	"testing"

	"app/notification/model"
)

func TestFindVariant(t *testing.T) {
	variants := []*model.TemplateVariant{
		{Language: "en", DeliveryMechanism: 1, Body: "English email"},
		{Language: "pl", DeliveryMechanism: 1, Body: "Polish email"},
		{Language: "en", DeliveryMechanism: 2, Body: "English SMS"},
	}

	v := findVariant(variants, "en", 1)
	if v == nil || v.Body != "English email" {
		t.Errorf("expected English email variant, got %v", v)
	}

	v = findVariant(variants, "pl", 1)
	if v == nil || v.Body != "Polish email" {
		t.Errorf("expected Polish email variant, got %v", v)
	}

	v = findVariant(variants, "en", 2)
	if v == nil || v.Body != "English SMS" {
		t.Errorf("expected English SMS variant, got %v", v)
	}

	v = findVariant(variants, "vi", 1)
	if v != nil {
		t.Errorf("expected nil for missing variant, got %v", v)
	}

	v = findVariant(variants, "pl", 2)
	if v != nil {
		t.Errorf("expected nil for missing mechanism, got %v", v)
	}
}
