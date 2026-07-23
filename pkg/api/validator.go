package api

import (
	"buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	"fmt"
	"github.com/bufbuild/protovalidate-go"
	"google.golang.org/protobuf/reflect/protoreflect"
	"sync"
)

var Validator *protovalidate.Validator
var constraintCache *_constraintCache

type _constraintCache struct {
	sync.RWMutex
	msg   map[string]*validate.MessageConstraints
	oneOf map[string]*validate.OneofConstraints
	field map[string]*validate.FieldConstraints
}

func ValidatorProvider() error {
	validator, err := protovalidate.New(
		protovalidate.WithStandardConstraintInterceptor(CommonConstraintInterceptor),
	)
	if err != nil {
		return err
	}

	constraintCache = &_constraintCache{
		msg:   make(map[string]*validate.MessageConstraints),
		oneOf: make(map[string]*validate.OneofConstraints),
		field: make(map[string]*validate.FieldConstraints),
	}

	Validator = validator

	return nil
}

func CommonConstraintInterceptor(resolver protovalidate.StandardConstraintResolver) protovalidate.StandardConstraintResolver {
	return &commonConstraintResolver{resolver}
}

type commonConstraintResolver struct {
	protovalidate.StandardConstraintResolver
}

func (c *commonConstraintResolver) ResolveMessageConstraints(desc protoreflect.MessageDescriptor) *validate.MessageConstraints {
	constraints := c.StandardConstraintResolver.ResolveMessageConstraints(desc)

	messageName := string(desc.Name())

	constraintID := func(name string) string {
		return fmt.Sprintf("%s.%s", messageName, name)
	}

	constraintCache.RLock()
	if cached, ok := constraintCache.msg[messageName]; ok {
		constraintCache.RUnlock()
		return cached
	}
	constraintCache.RUnlock()

	if constraints == nil {
		constraints = &validate.MessageConstraints{}
	}

	if constraints.Cel == nil {
		constraints.Cel = make([]*validate.Constraint, 0)
	}

	fieldMap := make(map[string]protoreflect.FieldDescriptor)

	for i := 0; i < desc.Fields().Len(); i++ {
		field := desc.Fields().Get(i)
		fieldMap[field.TextName()] = field
	}

	for _, field := range fieldMap {
		var constraint *validate.Constraint

		switch field.TextName() {
		case "effectiveStart":
			if _, ok := fieldMap["effectiveEnd"]; !ok {
				//option (buf.validate.message).cel = {
				//    id: "CreateSmsConcatTimeoutRequest.effectiveStart",
				//    message: "if effectiveEnd is set then effectiveStart must be set",
				//    expression: "has(this.effectiveEnd) ? has(this.effectiveStart) : true"
				//  };
				continue
			}

			constraint = &validate.Constraint{
				Id:         constraintID("effectiveEnd"),
				Message:    "Effective start must be less than to effective end",
				Expression: "has(this.effectiveStart) && has(this.effectiveEnd) ? this.effectiveStart < this.effectiveEnd : true",
			}

		case "effectiveEnd":

		case "name":
			constraint = &validate.Constraint{
				Id:         constraintID("name"),
				Message:    "Name must be set",
				Expression: "this.name.en != '' || this.name.pl != ''",
			}

		case "percentage":
			constraint = &validate.Constraint{
				Id:         constraintID("percentage"),
				Message:    "Percentage must be between 0 and 100",
				Expression: "this.percentage >= 0 && this.percentage <= 100",
			}
		}

		if constraint != nil {
			if constraint.Id == "" {
				constraint.Id = constraintID(field.TextName())
			}

			constraints.Cel = append(constraints.Cel, constraint)
		}
	}

	constraintCache.Lock()
	constraintCache.msg[messageName] = constraints
	constraintCache.Unlock()

	return constraints
}

func (c *commonConstraintResolver) ResolveOneofConstraints(desc protoreflect.OneofDescriptor) *validate.OneofConstraints {
	constraints := c.StandardConstraintResolver.ResolveOneofConstraints(desc)
	return constraints
}

func (c *commonConstraintResolver) ResolveFieldConstraints(desc protoreflect.FieldDescriptor) *validate.FieldConstraints {
	constraints := c.StandardConstraintResolver.ResolveFieldConstraints(desc)

	// constraints set in proto file
	if constraints != nil {
		return constraints
	}

	fieldName := string(desc.Name())
	messageName := string(desc.Parent().Name())

	constraintID := func() string {
		return fmt.Sprintf("%s.%s", messageName, fieldName)
	}

	cacheKey := fmt.Sprintf("%s.%s", messageName, fieldName)

	constraintCache.RLock()
	if cached, ok := constraintCache.field[cacheKey]; ok {
		constraintCache.RUnlock()
		return cached
	}
	constraintCache.RUnlock()

	var constraint *validate.Constraint

	switch fieldName {
	// TODO implement any common validation logic here TODO //
	case "ID":
	// validate in api service based on method

	case "priority":
		// handled by message constraints

	case "mcc":
		constraint = &validate.Constraint{
			Message:    "MCC must be between 1 and 1000",
			Expression: "this > 0 && this <= 1000",
		}
	case "mnc":
		constraint = &validate.Constraint{
			Message:    "MNC must be between 0 and 1000",
			Expression: "this >= 0 && this <= 1000",
		}
	}

	if constraint != nil {
		constraint.Id = constraintID()

		if constraints == nil {
			constraints = &validate.FieldConstraints{}
		}

		if constraints.Cel == nil {
			constraints.Cel = make([]*validate.Constraint, 0)
		}

		constraints.Cel = append(constraints.Cel, constraint)
	}

	constraintCache.Lock()
	constraintCache.field[cacheKey] = constraints
	constraintCache.Unlock()

	return constraints
}
