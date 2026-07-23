package main

import (
	"sort"
	"testing"

	corev1 "app/core/gen/core/v1"

	"github.com/bufbuild/protovalidate-go"
	"google.golang.org/protobuf/proto"
)

func TestEffectiveFieldPath(t *testing.T) {
	// message-level rule: empty path -> falls back to the rule id (UI path)
	if got := effectiveFieldPath("", "displayName.en"); got != "displayName.en" {
		t.Errorf("message-level: got %q, want displayName.en", got)
	}
	// field-level rule: real path is preserved
	if got := effectiveFieldPath("officeId", "SaveRoomRequest.officeId"); got != "officeId" {
		t.Errorf("field-level: got %q, want officeId", got)
	}
}

// uiFieldPaths validates msg and returns the sorted set of UI field paths the
// WASM validator would surface (via effectiveFieldPath), mirroring main.go.
func uiFieldPaths(t *testing.T, v *protovalidate.Validator, msg proto.Message) []string {
	t.Helper()
	err := v.Validate(msg)
	if err == nil {
		return nil
	}
	ve, ok := err.(*protovalidate.ValidationError)
	if !ok {
		t.Fatalf("unexpected non-validation error: %v", err)
	}
	var paths []string
	for _, viol := range ve.Violations {
		paths = append(paths, effectiveFieldPath(viol.GetFieldPath(), viol.GetConstraintId()))
	}
	sort.Strings(paths)
	return paths
}

func TestSaveRequestRequiredFields(t *testing.T) {
	v, err := protovalidate.New()
	if err != nil {
		t.Fatalf("validator init: %v", err)
	}

	tr := &corev1.TranslatedString{En: "x", Pl: "y"}

	cases := []struct {
		name string
		msg  proto.Message
		want []string
	}{
		{
			"room empty",
			&corev1.SaveRoomRequest{},
			[]string{"displayName.en", "displayName.pl", "officeId"},
		},
		{
			"room missing polish name",
			&corev1.SaveRoomRequest{OfficeId: "o", DisplayName: &corev1.TranslatedString{En: "x"}},
			[]string{"displayName.pl"},
		},
		{
			"room valid",
			&corev1.SaveRoomRequest{OfficeId: "o", DisplayName: tr},
			nil,
		},
		{
			"office empty",
			&corev1.SaveOfficeRequest{},
			[]string{"address", "displayName.en", "displayName.pl"},
		},
		{
			"office valid",
			&corev1.SaveOfficeRequest{DisplayName: tr, Address: "1 St"},
			nil,
		},
		{
			// Whole required set for the therapist Save request, including the
			// scalar contactEmail (email) and slug rules alongside the nested
			// TranslatedString profile fields.
			"therapist empty",
			&corev1.SaveTherapistRequest{},
			[]string{"contactEmail", "description.en", "description.pl", "professionalTitle.en", "professionalTitle.pl", "slug"},
		},
		{
			"therapist missing english description",
			&corev1.SaveTherapistRequest{
				ContactEmail:      "a@b.com",
				Slug:              "slug",
				ProfessionalTitle: tr,
				Description:       &corev1.TranslatedString{Pl: "y"},
			},
			[]string{"description.en"},
		},
		{
			"therapist valid",
			&corev1.SaveTherapistRequest{
				ContactEmail:      "a@b.com",
				Slug:              "slug",
				ProfessionalTitle: tr,
				Description:       tr,
			},
			nil,
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := uiFieldPaths(t, v, c.msg)
			if !equalStrings(got, c.want) {
				t.Errorf("got %v, want %v", got, c.want)
			}
		})
	}
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
