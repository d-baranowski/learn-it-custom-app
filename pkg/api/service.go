package api

import (
	"pkg/repository"
	"reflect"

	"go.uber.org/zap"

	"pkg/tracing"

	"github.com/uptrace/bun"
)

func NewService[
	TService any, // TService is the service struct
	TModel any,
	TPBModel any,
	TListViewResp any,
	TSaveReq any,
](
	db *bun.DB,
	tracer *tracing.Tracer,
	modelParser repository.ModelParser,
	viewEngine *repository.ViewEngine,
) *TService {
	service := reflect.New(reflect.TypeOf((*TService)(nil)).Elem()).Interface().(*TService)

	serviceValue := reflect.ValueOf(service).Elem()
	serviceType := serviceValue.Type()

	for i := 0; i < serviceType.NumField(); i++ {
		field := serviceValue.Field(i)
		fieldType := serviceType.Field(i).Type

		isPointer := fieldType.Kind() == reflect.Ptr
		if isPointer {
			fieldType = fieldType.Elem()
		}

		switch fieldType {

		case reflect.TypeOf(bun.DB{}):
			if isPointer && field.CanSet() {
				field.Set(reflect.ValueOf(db))
			} else {
				zap.L().Warn("db field is not settable", zap.String("service", serviceType.Name()))
			}

		case reflect.TypeOf(tracing.Tracer{}):
			if isPointer && field.CanSet() {
				field.Set(reflect.ValueOf(tracer))
			} else {
				zap.L().Warn("tracer field is not settable", zap.String("service", serviceType.Name()))
			}

		case reflect.TypeOf(AutocompleteMethod[TModel]{}):
			method := NewAutocompleteMethod[TModel](
				ACMethodProps[TModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)

			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(GetMethod[TModel, TPBModel]{}):
			method := NewGetMethod[TModel, TPBModel](
				GetMethodProps[TModel, TPBModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(ListMethod[TModel, TListViewResp]{}):
			method := NewListMethod[TModel, TListViewResp](
				ListMethodProps[TModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(CreateMethod[TModel, TSaveReq, TPBModel]{}):
			method := NewCreateMethod[TModel, TSaveReq, TPBModel](
				CreateMethodProps[TModel, TSaveReq, TPBModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(UpdateMethod[TModel, TSaveReq, TPBModel]{}):
			method := NewUpdateMethod[TModel, TSaveReq, TPBModel](
				UpdateMethodProps[TModel, TSaveReq, TPBModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(SoftDeleteMethod[TModel]{}):
			method := NewSoftDeleteMethod[TModel](
				SoftDeleteMethodProps[TModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}

		case reflect.TypeOf(DeleteMethod[TModel]{}):
			method := NewDeleteMethod[TModel](
				DeleteMethodProps[TModel]{
					DB:          db,
					Tracer:      tracer,
					ModelParser: modelParser,
					ViewEngine:  viewEngine,
				},
			)
			if isPointer {
				field.Set(reflect.ValueOf(method))
			} else {
				field.Set(reflect.ValueOf(*method))
			}
		}
	}

	return service
}
