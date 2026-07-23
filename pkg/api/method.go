package api

import (
	"context"
	"errors"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/request"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"
	"reflect"
	"strconv"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

const (
	listIncludeCountHeader = "x-utro-list-include-count"
	listCountOnlyHeader    = "x-utro-list-count-only"
)

type ACMethodProps[M any] struct {
	DB          *bun.DB
	Builder     repository.MultiReadBuilderFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	PostHooks   []repository.MultiReadPostHookFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

type AutocompleteMethod[M any] struct {
	repo      *repository.Repository[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	builder   repository.MultiReadBuilderFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	postHooks []repository.MultiReadPostHookFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	tracer    *tracing.Tracer
	validator *protovalidate.Validator
}

func NewAutocompleteMethod[M any](props ACMethodProps[M]) *AutocompleteMethod[M] {
	repo := repository.NewRepository[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)

	am := &AutocompleteMethod[M]{
		repo:      repo,
		builder:   props.Builder,
		postHooks: props.PostHooks,
		tracer:    props.Tracer,
	}

	if props.Validator != nil {
		am.validator = props.Validator
	} else {
		am.validator = Validator
	}

	return am
}

func (am *AutocompleteMethod[M]) Autocomplete(ctx context.Context, req *connect.Request[requestv1.AutocompleteRequest]) (*connect.Response[requestv1.AutocompleteResponse], error) {
	spanCtx, span, log := am.tracer.Start(ctx, "autocompleteMethod")
	defer span.End()

	log.Debug("Autocomplete", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := am.validator.Validate(req.Msg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	resp, err := am.repo.Autocomplete(spanCtx, req.Msg, &repository.AutocompleteExtraProps[M]{
		Builder:   am.builder,
		PostHooks: am.postHooks,
		UserId:    &userID,
		SkipRLS:   ctxHelpers.IsServiceMode(spanCtx),
	})

	if err != nil {
		return nil, CommonApiErrorHandler(err)
	}

	return connect.NewResponse(resp), nil
}

func (am *AutocompleteMethod[M]) SetBuilder(qb repository.MultiReadBuilderFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]) {
	am.builder = qb
}

func (am *AutocompleteMethod[M]) AddPostHook(pq repository.MultiReadPostHookFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]) {
	if am.postHooks == nil {
		am.postHooks = make([]repository.MultiReadPostHookFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse], 0)
	}
	am.postHooks = append(am.postHooks, pq)
}

type GetMethodProps[M, RESP any] struct {
	DB          *bun.DB
	Builder     repository.SingularReadBuilderFunc[M, requestv1.GetRequest, RESP]
	PostHooks   []repository.SingularReadPostHookFunc[M, requestv1.GetRequest, RESP]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

type GetMethod[M, RESP any] struct {
	repo        *repository.Repository[M, requestv1.GetRequest, RESP]
	builder     repository.SingularReadBuilderFunc[M, requestv1.GetRequest, RESP]
	postHooks   []repository.SingularReadPostHookFunc[M, requestv1.GetRequest, RESP]
	validator   *protovalidate.Validator
	tracer      *tracing.Tracer
	modelParser repository.ModelParser
}

func NewGetMethod[M, RESP any](props GetMethodProps[M, RESP]) *GetMethod[M, RESP] {
	repo := repository.NewRepository[M, requestv1.GetRequest, RESP](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)

	m := &GetMethod[M, RESP]{
		repo:        repo,
		builder:     props.Builder,
		postHooks:   props.PostHooks,
		tracer:      props.Tracer,
		modelParser: props.ModelParser,
	}

	if props.Validator != nil {
		m.validator = props.Validator
	} else {
		m.validator = Validator
	}

	return m
}

func (gm *GetMethod[M, RESP]) Get(ctx context.Context, req *connect.Request[requestv1.GetRequest]) (*connect.Response[RESP], error) {
	spanCtx, span, log := gm.tracer.Start(ctx, "getMethod")
	defer span.End()

	spanCtx = ctxHelpers.SetApiContext(spanCtx)

	modelType := reflect.TypeOf((*M)(nil)).Elem()
	respType := reflect.TypeOf((*RESP)(nil)).Elem()

	log.Debug("Get", zap.String("model", modelType.Name()), zap.String("resp", respType.Name()),
		zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := gm.validator.Validate(req.Msg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	// TODO WARNING - at the moment the modifications to the response will be potentially overridden by ModelToProtoAny
	resp := reflect.New(respType).Elem().Interface().(RESP)

	row, err := gm.repo.Get(spanCtx, req.Msg.ID, &repository.GetExtraProps[M, requestv1.GetRequest, RESP]{
		UserId:    &userID,
		SkipRLS:   ctxHelpers.IsServiceMode(spanCtx),
		Builder:   gm.builder,
		PostHooks: gm.postHooks,

		Req:  req.Msg,
		Resp: &resp,
	})

	if err != nil {
		// todo: check if no rows is not an error
		//if !errors.Is(err, sql.ErrNoRows) {
		//	log.Debug("error scanning", zap.Error(err))
		//	span.RecordError(err)
		//	return nil, err
		//}
		log.Error("error getting", zap.Error(err))
		span.RecordError(err)
		return nil, CommonApiErrorHandler(err)
	}

	msg, err := ModelToProtoAny[M, RESP](row, &resp)
	if err != nil {
		log.Error("error converting to proto", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	return connect.NewResponse(msg), nil
}

func (gm *GetMethod[M, RESP]) SetBuilder(qb repository.SingularReadBuilderFunc[M, requestv1.GetRequest, RESP]) {
	gm.builder = qb
}

func (gm *GetMethod[M, RESP]) AddPostHook(pq repository.SingularReadPostHookFunc[M, requestv1.GetRequest, RESP]) {
	if gm.postHooks == nil {
		gm.postHooks = make([]repository.SingularReadPostHookFunc[M, requestv1.GetRequest, RESP], 0)
	}
	gm.postHooks = append(gm.postHooks, pq)
}

type ListMethodProps[M any] struct {
	DB          *bun.DB
	Builder     repository.MultiReadBuilderFunc[M, requestv1.SelectRequest, request.ListResponse[M]]
	PostHooks   []repository.MultiReadPostHookFunc[M, requestv1.SelectRequest, request.ListResponse[M]]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

type ListMethod[M, RESP any] struct {
	repo      *repository.Repository[M, requestv1.SelectRequest, request.ListResponse[M]]
	builder   repository.MultiReadBuilderFunc[M, requestv1.SelectRequest, request.ListResponse[M]]
	postHooks []repository.MultiReadPostHookFunc[M, requestv1.SelectRequest, request.ListResponse[M]]
	validator *protovalidate.Validator
	tracer    *tracing.Tracer
}

func NewListMethod[M, RESP any](props ListMethodProps[M]) *ListMethod[M, RESP] {
	repo := repository.NewRepository[M, requestv1.SelectRequest, request.ListResponse[M]](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)
	lvm := &ListMethod[M, RESP]{
		repo:      repo,
		builder:   props.Builder,
		postHooks: props.PostHooks,
		tracer:    props.Tracer,
	}

	if props.Validator != nil {
		lvm.validator = props.Validator
	} else {
		lvm.validator = Validator
	}

	return lvm
}

func (lm *ListMethod[M, RESP]) List(ctx context.Context, req *connect.Request[requestv1.SelectRequest]) (*connect.Response[RESP], error) {
	spanCtx, span, log := lm.tracer.Start(ctx, "listViewMethod.ListView")
	defer span.End()

	viewType := reflect.TypeOf((*M)(nil)).Elem()
	respType := reflect.TypeOf((*RESP)(nil)).Elem()

	log.Debug("List", zap.String("view", viewType.Name()), zap.String("resp", respType.Name()),
		zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := lm.validator.Validate(req.Msg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	if req.Msg.Pagination == nil {
		req.Msg.Pagination = &requestv1.Pagination{
			Take: 10,
			Skip: 0,
		}
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)
	includeCount, _ := strconv.ParseBool(req.Header().Get(listIncludeCountHeader))
	countOnly, _ := strconv.ParseBool(req.Header().Get(listCountOnlyHeader))

	result, err := lm.repo.List(spanCtx, req.Msg, &repository.ListOptions[M]{
		UserId:       &userID,
		SkipRLS:      ctxHelpers.IsServiceMode(spanCtx),
		Builder:      lm.builder,
		PostHooks:    lm.postHooks,
		IncludeCount: includeCount || countOnly,
		CountOnly:    countOnly,
	})

	if err != nil {
		span.RecordError(err)
		return nil, CommonApiErrorHandler(err)
	}

	listResp := result

	resp := reflect.New(respType).Elem().Interface().(RESP)

	msg, err := ModelToProtoAny[request.ListResponse[M], RESP](listResp, &resp)
	if err != nil {
		log.Error("error converting to proto", zap.Error(err))
		span.RecordError(err)
		return nil, CommonApiErrorHandler(err)
	}

	return connect.NewResponse(msg), nil
}

func (lm *ListMethod[M, RESP]) SetBuilder(qb repository.MultiReadBuilderFunc[M, requestv1.SelectRequest, request.ListResponse[M]]) {
	lm.builder = qb
}

func (lm *ListMethod[M, RESP]) AddPostHook(pq repository.MultiReadPostHookFunc[M, requestv1.SelectRequest, request.ListResponse[M]]) {
	if lm.postHooks == nil {
		lm.postHooks = make([]repository.MultiReadPostHookFunc[M, requestv1.SelectRequest, request.ListResponse[M]], 0)
	}
	lm.postHooks = append(lm.postHooks, pq)
}

type CreateMethod[M, REQ, RESP any] struct {
	repo        *repository.Repository[M, REQ, RESP]
	manualQuery repository.ManualQueryFunc[M, REQ]
	preHooks    []repository.MutationPreHookFunc[M, REQ]
	postHooks   []repository.MutationPostHookFunc[M, REQ, RESP]
	validator   *protovalidate.Validator
	tracer      *tracing.Tracer
}

type CreateMethodProps[M, REQ, RESP any] struct {
	DB          *bun.DB
	ManualQuery repository.ManualQueryFunc[M, REQ]
	PreHooks    []repository.MutationPreHookFunc[M, REQ]
	PostHooks   []repository.MutationPostHookFunc[M, REQ, RESP]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

func NewCreateMethod[M, REQ, RESP any](props CreateMethodProps[M, REQ, RESP]) *CreateMethod[M, REQ, RESP] {
	repo := repository.NewRepository[M, REQ, RESP](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)

	cm := &CreateMethod[M, REQ, RESP]{
		repo:        repo,
		manualQuery: props.ManualQuery,
		preHooks:    props.PreHooks,
		postHooks:   props.PostHooks,
		tracer:      props.Tracer,
	}

	if props.Validator != nil {
		cm.validator = props.Validator
	} else {
		cm.validator = Validator
	}

	return cm
}

func (cm *CreateMethod[M, REQ, RESP]) Create(ctx context.Context, req *connect.Request[REQ]) (*connect.Response[RESP], error) {
	spanCtx, span, log := cm.tracer.Start(ctx, "createMethod")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()
	reqType := reflect.TypeOf((*REQ)(nil)).Elem()

	reqMsgValue := reflect.ValueOf(req.Msg)
	reqMsgInterface := reqMsgValue.Interface()
	reqMsg, ok := reqMsgInterface.(proto.Message)
	if !ok {
		panic("invalid proto message")
	}

	if err := cm.validator.Validate(reqMsg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	rowInstance := reflect.New(modelType).Elem().Interface().(M)

	row, err := ProtoToModel(reqMsg, &rowInstance)
	if err != nil {
		log.Error("error converting to model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	mod, err := cm.repo.ParseModel(ctx, row)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	msgFieldMap := protoMessageFieldMap(row, reqMsg)

	for _, field := range mod.BunTable.PKs {
		modField, modFieldExists := mod.GetGoField(field.GoName)
		if !modFieldExists {
			log.Error("primary key field not found in model", zap.String("field", field.GoName))
			span.RecordError(errors.New("primary key field not found in model"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("field not found in model"))
		}

		// delete the field from the msg field map
		delete(msgFieldMap, modField.RpcName)

		// allow field default values
		if field.NullZero {
			continue
		}

		pkSet, pkSetErr := isFieldSet(row, field.GoName)
		if pkSetErr != nil {
			log.Error("error checking if field is set", zap.Error(pkSetErr))
			span.RecordError(pkSetErr)
			return nil, pkSetErr
		}

		if !pkSet {
			log.Error("primary key not set and not null zero")
			span.RecordError(errors.New("primary key not set and not null zero"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("primary key not set and not null zero"))
		}
	}

	for _, field := range mod.BunTable.DataFields {
		modField, modFieldExists := mod.GetGoField(field.GoName)
		if !modFieldExists {
			log.Error("field not found in model", zap.String("field", field.GoName))
			span.RecordError(errors.New("field not found in model"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("field not found in model"))
		}

		// delete the field from the msg field map
		delete(msgFieldMap, modField.RpcName)
	}

	if len(msgFieldMap) > 0 {
		log.Debug("fields not found on go model", zap.Any("fields", msgFieldMap))
		// There are now valid use cases for extra fields in the proto message that are not mapped to the Go model,
		// such as customerIds which are present on the link table and not base model itself but need to be handled by the base model api
		// We used to throw an error but no longer necessary
		//span.RecordError(errors.New("fields not found on go model"))
		//return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("fields not found on go model"))
	}

	respType := reflect.TypeOf((*RESP)(nil)).Elem()
	resp := reflect.New(respType).Elem().Interface().(RESP)

	result, err := cm.repo.Create(spanCtx, row, &repository.CreateExtraProps[M, REQ, RESP]{
		UserId:      &userID,
		SkipRLS:     ctxHelpers.IsServiceMode(spanCtx),
		ManualQuery: cm.manualQuery,
		PreHooks:    cm.preHooks,
		PostHooks:   cm.postHooks,

		Req:  req.Msg,
		Resp: &resp,
	})

	if err != nil {
		log.Error("error creating", zap.Error(err))
		span.RecordError(err)
		// If it's already a ConnectRPC error, return it as-is to preserve the status code
		var cerr *connect.Error
		if errors.As(err, &cerr) {
			return nil, cerr
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	log.Debug("Create", zap.String("model", modelType.Name()), zap.String("req", reqType.Name()),
		zap.String("resp", respType.Name()), zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	msg, err := ModelToProtoAny[M, RESP](result, &resp)
	if err != nil {
		log.Error("error converting to proto", zap.Error(err))
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(msg), nil
}

func (cm *CreateMethod[M, REQ, RESP]) SetManualQuery(mq repository.ManualQueryFunc[M, REQ]) {
	cm.manualQuery = mq
}

func (cm *CreateMethod[M, REQ, RESP]) AddPreHook(pq repository.MutationPreHookFunc[M, REQ]) {
	if cm.preHooks == nil {
		cm.preHooks = make([]repository.MutationPreHookFunc[M, REQ], 0)
	}
	cm.preHooks = append(cm.preHooks, pq)
}

func (cm *CreateMethod[M, REQ, RESP]) AddPostHook(pq repository.MutationPostHookFunc[M, REQ, RESP]) {
	if cm.postHooks == nil {
		cm.postHooks = make([]repository.MutationPostHookFunc[M, REQ, RESP], 0)
	}
	cm.postHooks = append(cm.postHooks, pq)
}

type UpdateMethod[M, REQ, RESP any] struct {
	repo        *repository.Repository[M, REQ, RESP]
	manualQuery repository.ManualQueryFunc[M, REQ]
	preHooks    []repository.MutationPreHookFunc[M, REQ]
	postHooks   []repository.MutationPostHookFunc[M, REQ, RESP]
	validator   *protovalidate.Validator
	tracer      *tracing.Tracer
}

type UpdateMethodProps[M, REQ, RESP any] struct {
	DB          *bun.DB
	ManualQuery repository.ManualQueryFunc[M, REQ]
	PreHooks    []repository.MutationPreHookFunc[M, REQ]
	PostHooks   []repository.MutationPostHookFunc[M, REQ, RESP]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

func NewUpdateMethod[M, REQ, RESP any](props UpdateMethodProps[M, REQ, RESP]) *UpdateMethod[M, REQ, RESP] {
	repo := repository.NewRepository[M, REQ, RESP](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)
	um := &UpdateMethod[M, REQ, RESP]{
		repo:        repo,
		manualQuery: props.ManualQuery,
		preHooks:    props.PreHooks,
		postHooks:   props.PostHooks,
		tracer:      props.Tracer,
	}

	if props.Validator != nil {
		um.validator = props.Validator
	} else {
		um.validator = Validator
	}

	return um
}

func (um *UpdateMethod[M, REQ, RESP]) Update(ctx context.Context, req *connect.Request[REQ]) (*connect.Response[RESP], error) {
	spanCtx, span, log := um.tracer.Start(ctx, "updateMethod")
	defer span.End()

	spanCtx = ctxHelpers.SetApiContext(spanCtx)

	modelType := reflect.TypeOf((*M)(nil)).Elem()
	reqType := reflect.TypeOf((*REQ)(nil)).Elem()
	respType := reflect.TypeOf((*RESP)(nil)).Elem()

	log.Debug("Update", zap.String("model", modelType.Name()), zap.String("req", reqType.Name()),
		zap.String("resp", respType.Name()), zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	reqMsgValue := reflect.ValueOf(req.Msg)
	reqMsgInterface := reqMsgValue.Interface()
	reqMsg, ok := reqMsgInterface.(proto.Message)
	if !ok {
		log.Error("invalid proto message")
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("invalid proto message"))
	}

	if err := um.validator.Validate(reqMsg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	rowInstance := reflect.New(modelType).Elem().Interface().(M)

	row, err := ProtoToModel(reqMsg, &rowInstance)
	if err != nil {
		log.Error("error converting to model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	mod, err := um.repo.ParseModel(ctx, row)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	msgFieldMap := protoMessageFieldMap(row, reqMsg)

	for _, field := range mod.BunTable.PKs {
		modField, modFieldExists := mod.GetGoField(field.GoName)
		if !modFieldExists {
			log.Error("primary key field not found in model", zap.String("field", field.GoName))
			span.RecordError(errors.New("primary key field not found in model"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("field not found in model"))
		}

		// delete the field from the msg field map
		delete(msgFieldMap, modField.RpcName)

		pkSet, pkSetErr := isFieldSet(row, field.GoName)
		if pkSetErr != nil {
			log.Error("error checking if field is set", zap.Error(pkSetErr))
			span.RecordError(pkSetErr)
			return nil, pkSetErr
		}

		if !pkSet {
			log.Error("primary key not set")
			span.RecordError(errors.New("primary key not set"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("primary key not set"))
		}
	}

	var excludeColumns []string

	for _, field := range mod.BunTable.DataFields {
		modField, modFieldExists := mod.GetGoField(field.GoName)
		if !modFieldExists {
			log.Error("field not found in model", zap.String("field", field.GoName))
			span.RecordError(errors.New("field not found in model"))
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("field not found in model"))
		}

		// delete the field from the msg field map
		delete(msgFieldMap, modField.RpcName)

		switch field.GoName {
		case "CreatedBy", "CreatedAt", "DeletedBy", "DeletedAt":
			excludeColumns = append(excludeColumns, field.Name)

		default:
			excluded, excludedErr := isExcludedFromUpdate(reqMsg, modField.RpcName)
			if excludedErr != nil {
				log.Error("error checking if field is excluded", zap.Error(excludedErr))
				span.RecordError(excludedErr)
				return nil, excludedErr
			}
			if excluded {
				excludeColumns = append(excludeColumns, field.Name)
			}
		}
	}

	if len(msgFieldMap) > 0 {
		log.Error("fields not found on go model", zap.Any("fields", msgFieldMap))
		// There are now valid use cases for extra fields in the proto message that are not mapped to the Go model,
		// such as customerIds which are present on the link table and not base model itself but need to be handled by the base model api
		// We used to throw an error but no longer necessary
		//span.RecordError(errors.New("fields not found on go model"))
		//return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("fields not found on go model"))
	}

	resp := reflect.New(respType).Elem().Interface().(RESP)

	result, err := um.repo.Update(spanCtx, row, &repository.UpdateOptions[M, REQ, RESP]{
		ManualQuery: um.manualQuery,
		PreHooks:    um.preHooks,
		PostHooks:   um.postHooks,

		UserId:         &userID,
		SkipRLS:        ctxHelpers.IsServiceMode(spanCtx),
		ExcludeColumns: excludeColumns,

		Req:  req.Msg,
		Resp: &resp,
	})

	if err != nil {
		log.Error("error updating", zap.Error(err))
		span.RecordError(err)
		// If it's already a ConnectRPC error, return it as-is to preserve the status code
		var cerr *connect.Error
		if errors.As(err, &cerr) {
			return nil, cerr
		}
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	msg, err := ModelToProtoAny[M, RESP](result, &resp)
	if err != nil {
		log.Error("error converting to proto", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	return connect.NewResponse(msg), nil
}

func (um *UpdateMethod[M, REQ, RESP]) SetManualQuery(mq repository.ManualQueryFunc[M, REQ]) {
	um.manualQuery = mq
}

func (um *UpdateMethod[M, REQ, RESP]) AddPreHook(pq repository.MutationPreHookFunc[M, REQ]) {
	if um.preHooks == nil {
		um.preHooks = make([]repository.MutationPreHookFunc[M, REQ], 0)
	}
	um.preHooks = append(um.preHooks, pq)
}

func (um *UpdateMethod[M, REQ, RESP]) AddPostHook(pq repository.MutationPostHookFunc[M, REQ, RESP]) {
	if um.postHooks == nil {
		um.postHooks = make([]repository.MutationPostHookFunc[M, REQ, RESP], 0)
	}
	um.postHooks = append(um.postHooks, pq)
}

type SoftDeleteMethod[M any] struct {
	repo      *repository.Repository[M, requestv1.DeleteRequest, requestv1.DeleteResponse]
	postHooks []repository.DeletePostHookFunc[M]
	validator *protovalidate.Validator
	tracer    *tracing.Tracer
}

type SoftDeleteMethodProps[M any] struct {
	DB          *bun.DB
	PostHooks   []repository.DeletePostHookFunc[M]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

func NewSoftDeleteMethod[M any](props SoftDeleteMethodProps[M]) *SoftDeleteMethod[M] {
	repo := repository.NewRepository[M, requestv1.DeleteRequest, requestv1.DeleteResponse](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)

	sdm := &SoftDeleteMethod[M]{
		repo:      repo,
		postHooks: props.PostHooks,
		tracer:    props.Tracer,
	}

	if props.Validator != nil {
		sdm.validator = props.Validator
	} else {
		sdm.validator = Validator
	}

	return sdm
}

func (sdm *SoftDeleteMethod[M]) SoftDelete(ctx context.Context, req *connect.Request[requestv1.DeleteRequest]) (*connect.Response[requestv1.DeleteResponse], error) {
	spanCtx, span, log := sdm.tracer.Start(ctx, "softDeleteMethod")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("SoftDelete", zap.String("model", modelType.Name()),
		zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := sdm.validator.Validate(req.Msg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	resp := &requestv1.DeleteResponse{
		RowsAffected: 0,
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	resp, err := sdm.repo.SoftDelete(spanCtx, req.Msg.IDs, &repository.SoftDeleteOptions[M]{
		UserId:  &userID,
		SkipRLS: ctxHelpers.IsServiceMode(spanCtx),
		Req:     req.Msg,
		Resp:    resp,

		PostHooks:   sdm.postHooks,
		Transaction: nil,
	})

	if err != nil {
		log.Error("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, CommonApiErrorHandler(err)
	}

	return connect.NewResponse(resp), nil
}

func (sdm *SoftDeleteMethod[M]) AddPostHook(pq repository.DeletePostHookFunc[M]) {
	if sdm.postHooks == nil {
		sdm.postHooks = make([]repository.DeletePostHookFunc[M], 0)
	}
	sdm.postHooks = append(sdm.postHooks, pq)
}

type DeleteMethod[M any] struct {
	repo      *repository.Repository[M, requestv1.DeleteRequest, requestv1.DeleteResponse]
	postHooks []repository.DeletePostHookFunc[M]
	validator *protovalidate.Validator
	tracer    *tracing.Tracer
}

type DeleteMethodProps[M any] struct {
	DB          *bun.DB
	PostHooks   []repository.DeletePostHookFunc[M]
	Validator   *protovalidate.Validator
	Tracer      *tracing.Tracer
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

func NewDeleteMethod[M any](props DeleteMethodProps[M]) *DeleteMethod[M] {
	repo := repository.NewRepository[M, requestv1.DeleteRequest, requestv1.DeleteResponse](props.DB, props.Tracer, props.ModelParser, props.ViewEngine)

	dm := &DeleteMethod[M]{
		repo:      repo,
		postHooks: props.PostHooks,
		tracer:    props.Tracer,
	}

	if props.Validator != nil {
		dm.validator = props.Validator
	} else {
		dm.validator = Validator
	}

	return dm
}

func (dm *DeleteMethod[M]) Delete(ctx context.Context, req *connect.Request[requestv1.DeleteRequest]) (*connect.Response[requestv1.DeleteResponse], error) {
	spanCtx, span, log := dm.tracer.Start(ctx, "deleteMethod")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("Delete", zap.String("model", modelType.Name()), zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := dm.validator.Validate(req.Msg); err != nil {
		log.Debug("error validating", zap.Error(err))
		span.RecordError(err)
		return nil, ValidationErrorHandler(err)
	}

	resp := &requestv1.DeleteResponse{
		RowsAffected: 0,
	}

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	resp, err := dm.repo.Delete(spanCtx, req.Msg.IDs, &repository.DeleteOptions[M]{
		UserId:      &userID,
		SkipRLS:     ctxHelpers.IsServiceMode(spanCtx),
		Req:         req.Msg,
		Resp:        resp,
		PostHooks:   dm.postHooks,
		Transaction: nil,
	})

	if err != nil {
		log.Error("error deleting", zap.Error(err))
		span.RecordError(err)
		return nil, CommonApiErrorHandler(err)
	}

	return connect.NewResponse(resp), nil
}

func (dm *DeleteMethod[M]) AddPostHook(pq repository.DeletePostHookFunc[M]) {
	if dm.postHooks == nil {
		dm.postHooks = make([]repository.DeletePostHookFunc[M], 0)
	}
	dm.postHooks = append(dm.postHooks, pq)
}
