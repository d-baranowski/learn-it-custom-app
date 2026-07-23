//go:build js && wasm

package main

import (
	_ "app/core/gen/core/v1"
	_ "app/notification/gen/notification/v1"
	"buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	"errors"
	"fmt"
	"github.com/bufbuild/protovalidate-go"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/anypb"
	"syscall/js"
)

func validateMessage(this js.Value, p []js.Value) interface{} {
	messageJson := p[0].String()

	var anyMessage anypb.Any

	//	println("Message JSON:", messageJson)

	err := protojson.Unmarshal([]byte(messageJson), &anyMessage)
	if err != nil {
		return newJsError(
			fmt.Sprintf("Failed to unmarshal JSON to Any: %s", err.Error()),
		)
	}

	msg, err := anyMessage.UnmarshalNew()
	if err != nil {
		return newJsError(
			fmt.Sprintf("Failed to unmarshal Any to message: %s", err.Error()),
		)

	}

	v, err := protovalidate.New(
		protovalidate.WithFailFast(false), // this is the default
	)
	if err != nil {
		return newJsError(
			fmt.Sprintf("Failed to create validator: %s", err.Error()),
		)
	}

	err = v.Validate(msg)
	if err != nil {
		var valErr *protovalidate.ValidationError
		if errors.As(err, &valErr) {
			return collectFieldErrors(valErr)
		}

		return newJsError(
			fmt.Sprintf("Validation failed: %s", err.Error()),
		)
	}

	return js.ValueOf(map[string]interface{}{
		"ok": true,
	})

}

func main() {
	js.Global().Set("validateMessage", js.FuncOf(validateMessage))
	select {}
}

func collectFieldErrors(valErr *protovalidate.ValidationError) js.Value {
	jsResult := js.Global().Get("Object").New()
	jsResult.Set("ok", true)

	jsErrors := js.Global().Get("Array").New()
	jsResult.Set("errors", jsErrors)

	for _, violation := range valErr.Violations {
		jsResult.Set("ok", false)
		jsErrors.Call("push", newJsViolation(violation))
	}

	return jsResult
}

func newJsViolation(violation *validate.Violation) js.Value {
	return js.ValueOf(map[string]interface{}{
		"constraintID": violation.GetConstraintId(),
		"fieldPath":    effectiveFieldPath(violation.GetFieldPath(), violation.GetConstraintId()),
		"forKey":       violation.GetForKey(),
		"message":      violation.GetMessage(),
	})
}

func newJsError(message string) js.Value {
	return js.ValueOf(map[string]interface{}{
		"error":   true,
		"message": message,
	})
}
