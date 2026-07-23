package model

import (
	"reflect"
	"strings"
	"testing"

	"pkg/repository"
)

// labelRegistrations mirrors fx.Invoke calls in Module. Adding a new
// labeler registration to fx.go without listing it here will cause this
// test to fail for any field that depended on it.
var labelRegistrations = []func(repository.AutoLabeler) error{
	CustomerLabel,
	LanguageLabel,
	OfficeLabel,
	RecurringCashflowLabel,
	RoleLabel,
	RoomLabel,
	ServiceLabel,
	SessionLabel,
	CancelledByUserLabel,
	TeamLabel,
	TherapistAbbreviationLabel,
	TherapistLabel,
	TherapyLabel,
	UserAbbreviationLabel,
	UserLabel,
	UserRolesLabel,
	UserTeamsLabel,
}

// modelsToCheck mirrors registerModelsWithBun. The AutoLabeler walks struct
// fields the first time a model is requested and panics if a *Label field has
// no labeler config — this test surfaces that at build time.
var modelsToCheck = []any{
	(*Absence)(nil),
	(*WorkingHours)(nil),
	(*Country)(nil),
	(*IssuesAndSuggestions)(nil),
	(*Language)(nil),
	(*Office)(nil),
	(*Permission)(nil),
	(*Role)(nil),
	(*Room)(nil),
	(*Service)(nil),
	(*SessionCustomer)(nil),
	(*Session)(nil),
	(*Customer)(nil),
	(*Team)(nil),
	(*User)(nil),
	(*RecurringCashflow)(nil),
	(*Transaction)(nil),
	(*TherapistCustomer)(nil),
	(*TherapistService)(nil),
	(*Therapist)(nil),
	(*TherapyCustomer)(nil),
	(*Therapy)(nil),
	(*UserLock)(nil),
	(*UserPermission)(nil),
	(*UserRole)(nil),
	(*UserSession)(nil),
	(*UserSetting)(nil),
	(*UserTeam)(nil),
	(*SystemSettings)(nil),
}

func TestAllModelLabelFieldsHaveLabelerConfig(t *testing.T) {
	labeler, err := repository.NewAutoLabeler("Europe/Warsaw")
	if err != nil {
		t.Fatalf("NewAutoLabeler: %v", err)
	}
	for _, reg := range labelRegistrations {
		if err := reg(labeler); err != nil {
			t.Fatalf("label registration: %v", err)
		}
	}

	for _, m := range modelsToCheck {
		typ := reflect.TypeOf(m).Elem()
		for i := 0; i < typ.NumField(); i++ {
			f := typ.Field(i)
			if f.Name == "AutoLabel" || f.Type.String() == "repository.AutoLabel" {
				continue
			}
			if !strings.HasSuffix(f.Name, "Label") {
				continue
			}
			ctx, skip := labelContextFromTag(f.Tag.Get("label"))
			if skip {
				continue
			}
			if !labeler.HasLabelConfig(ctx, f.Name) {
				t.Errorf("model %s field %s has no labeler config — production will panic when this model is first requested",
					typ.Name(), f.Name)
			}
		}
	}
}

// labelContextFromTag mirrors the parsing inside autoLabeler.AutoLabel: an
// empty tag means the default context, "-" means skip the field, anything
// else is a named context.
func labelContextFromTag(tag string) (ctx *string, skip bool) {
	if tag == "" {
		return nil, false
	}
	parts := strings.Split(tag, ",")
	if parts[0] == "-" {
		return nil, true
	}
	if parts[0] == "" {
		return nil, false
	}
	c := parts[0]
	return &c, false
}
