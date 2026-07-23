package api

import (
	"buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	"errors"
	"github.com/bufbuild/protovalidate-go"
	apiv1 "pkg/api/gen/api/v1"
	"testing"
)

func TestValidator(t *testing.T) {
	err := ValidatorProvider()
	if err != nil {
		t.Errorf("ValidatorProvider() error = %v", err)
	}

	if Validator == nil {
		t.Errorf("Validator is nil")
	}

	if constraintCache == nil {
		t.Errorf("constraintCache is nil")
	}

	msg := &apiv1.TestValidatorMessage{
		Mcc: 1001,
		Mnc: 1002,
	}

	err = Validator.Validate(msg)

	var valErr *protovalidate.ValidationError
	if !errors.As(err, &valErr) {
		t.Errorf("Validator.Validate() error = %v, wantErr %v", err, true)
	}

	var violations []*validate.Violation
	for _, violation := range valErr.Violations {
		violations = append(violations, violation)
	}

	if len(violations) != 2 {
		t.Errorf("Validator.Validate() violations = %v, want 2", len(violations))
	}

	if violations[0].ConstraintId != "TestValidatorMessage.mcc" {
		t.Errorf("Validator.Validate() violations[0].ConstraintId = %s, want TestValidatorMessage.mcc", violations[0].ConstraintId)
	}

	if violations[1].ConstraintId != "TestValidatorMessage.mnc" {
		t.Errorf("Validator.Validate() violations[1].ConstraintId = %s, want TestValidatorMessage.mnc", violations[1].ConstraintId)
	}
}
