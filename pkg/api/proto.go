package api

import (
	"errors"
	"fmt"
	"reflect"

	jsoniter "github.com/json-iterator/go"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func ModelToProto[T any, M proto.Message](model *T, msg M) (M, error) {
	msgType := reflect.TypeOf(msg).Elem()
	msgInstance := reflect.New(msgType).Interface().(M)

	if model == nil {
		return msgInstance, nil
	}

	bytes, err := jsoniter.Marshal(model)
	if err != nil {
		return msgInstance, err
	}

	umo := protojson.UnmarshalOptions{
		AllowPartial:   true,
		DiscardUnknown: true,
	}
	err = umo.Unmarshal(bytes, msgInstance)
	if err != nil {
		return msgInstance, err
	}

	return msgInstance, nil
}

func ModelToProtoAny[T any, M any](model *T, msg *M) (*M, error) {
	msgType := reflect.TypeOf(msg).Elem()
	msgInstance := reflect.New(msgType).Interface()

	if model == nil {
		return msg, nil
	}

	var protoMsg proto.Message
	var ok bool

	if protoMsg, ok = msgInstance.(proto.Message); !ok {
		return nil, errors.New("msg is not a proto.Message")
	}

	bytes, err := jsoniter.Marshal(model)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal msg to json: %w", err)
	}

	umo := protojson.UnmarshalOptions{
		AllowPartial:   true,
		DiscardUnknown: true,
	}
	err = umo.Unmarshal(bytes, protoMsg)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal msg %s from json: %w", bytes, err)
	}

	// Copy any non-nil values from original msg to msgInstance
	if msg != nil {
		msgValue := reflect.ValueOf(msg).Elem()
		msgInstanceValue := reflect.ValueOf(msgInstance).Elem()

		for i := 0; i < msgValue.NumField(); i++ {
			field := msgValue.Field(i)
			if field.IsValid() && !field.IsZero() {
				msgInstanceField := msgInstanceValue.Field(i)
				if msgInstanceField.CanSet() {
					msgInstanceField.Set(field)
				}
			}
		}
	}

	return msgInstance.(*M), nil
}

func ProtoToModel[T any](msg proto.Message, model *T) (*T, error) {
	if msg == nil {
		return nil, nil
	}

	mo := protojson.MarshalOptions{
		AllowPartial:    true,
		EmitUnpopulated: true,
		UseEnumNumbers:  true,
	}

	bytes, err := mo.Marshal(msg)
	if err != nil {
		return nil, err
	}

	// int64 gets marshalled to string causing the test to fail
	err = jsoniter.Unmarshal(bytes, &model)
	if err != nil {
		return nil, err
	}

	return model, nil
}
