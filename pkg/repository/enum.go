package repository

import (
	"errors"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	apiv1 "pkg/api/gen/api/v1"
	"sort"
)

type EnumValue struct {
	Name  string
	Value int
}

func GetEnumOrder(enumDesc protoreflect.EnumDescriptor) ([]int, bool, error) {
	enumName := string(enumDesc.FullName())

	enumValueCount := enumDesc.Values().Len()
	values := make([]EnumValue, 0)

	for i := 0; i < 10001; i++ {
		enumValDesc := enumDesc.Values().ByNumber(protoreflect.EnumNumber(i))
		if enumValDesc == nil {
			continue
		}

		ext := proto.GetExtension(enumValDesc.Options(), apiv1.E_TsEnumDesc)
		if ext == nil {
			zap.L().Warn("enum value does not have a ts enum desc", zap.Any("enum", enumName), zap.Int("value", i))
			return nil, false, nil
		}

		displayName, ok := ext.(string)
		if !ok {
			zap.L().Warn("enum value display name is not a string", zap.Any("enum", enumName), zap.Int("value", i))
			return nil, false, nil
		}

		values = append(values, EnumValue{
			Name:  displayName,
			Value: i,
		})

		enumValueCount--

		if enumValueCount == 0 {
			break
		}
	}

	if enumValueCount != 0 {
		zap.L().Warn("enum value count mismatch", zap.Any("enum", enumName), zap.Int("count", enumValueCount))
		return nil, false, errors.New("enum value count mismatch, enum value must be less than 1001")
	}

	sort.Slice(values, func(i, j int) bool {
		return values[i].Name < values[j].Name
	})

	order := make([]int, 0)
	for _, v := range values {
		order = append(order, v.Value)
	}

	return order, true, nil
}
