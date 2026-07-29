package repository

import (
	"context"
	"database/sql"
	"errors"
	"pkg/request"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"
	"pkg/unix"
	"pkg/util"
	"reflect"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type Repository[M, REQ, RESP any] struct {
	db          *bun.DB
	tracer      *tracing.Tracer
	modelParser ModelParser
	viewEngine  *ViewEngine
}

func NewRepository[M, REQ, RESP any](db *bun.DB, tracer *tracing.Tracer, modelParser ModelParser, viewEngine *ViewEngine) *Repository[M, REQ, RESP] {
	return &Repository[M, REQ, RESP]{
		db:          db,
		tracer:      tracer,
		modelParser: modelParser,
		viewEngine:  viewEngine,
	}
}

type AutocompleteExtraProps[M any] struct {
	Builder   MultiReadBuilderFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	PostHooks []MultiReadPostHookFunc[M, requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]
	UserId    *string
	SkipRLS   bool
}

func (r *Repository[M, REQ, RESP]) Autocomplete(ctx context.Context, req *requestv1.AutocompleteRequest, options *AutocompleteExtraProps[M]) (*requestv1.AutocompleteResponse, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "autocomplete")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("Autocomplete", zap.String("model", modelType.Name()))

	userID := options.UserId

	row := reflect.New(modelType).Elem().Interface().(M)

	mod, err := r.modelParser.ParseModel(ctx, &row)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	result := make([]*M, 0)

	err = r.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		spanCtx, span, log := r.tracer.Start(ctx, "autocomplete-tx")
		defer span.End()
		err := AttachUserIdToTx(ctx, log, tx)
		if err != nil {
			log.Error("error attaching user id to tx", zap.Error(err))
			span.RecordError(err)
			return err
		}
		if !options.SkipRLS {
			err = UseRLSRole(spanCtx, log, tx)
			if err != nil {
				log.Error("error using RLS role", zap.Error(err))
				span.RecordError(err)
				return err
			}
		} else if err = BypassRLS(spanCtx, log, tx); err != nil {
			span.RecordError(err)
			return err
		}

		sq := tx.NewSelect().TableExpr(mod.TableName(ctx))
		err = whereBuilder(ctx, sq.QueryBuilder(), mod, req.Where)
		if err != nil {
			log.Error("error building autocomplete where", zap.Error(err))
			span.RecordError(err)
			return err
		}

		if options.Builder != nil {
			sq, err = options.Builder(sq, &ExtraInfoReq[requestv1.AutocompleteRequest]{
				Request: req,
				UserId:  userID,
			})
			if err != nil {
				log.Debug("error building query", zap.Error(err))
				span.RecordError(err)
				return err
			}
		}

		if mod.View == nil {
			sq = sq.Model(&row)
		} else {
			useViewErr := r.viewEngine.UseView(spanCtx, mod, row)
			if useViewErr != nil {
				log.Error("error using view", zap.Error(useViewErr))
				span.RecordError(useViewErr)
				return useViewErr
			}
		}

		// todo: safety limit, remove when it haunts us
		sq.Limit(15000)

		err = sq.Scan(spanCtx, &result)
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				log.Debug("error scanning", zap.Error(err))
				span.RecordError(err)
				return err
			}
		}
		return nil
	})

	if err != nil {
		// If the error is caused by a missing view (e.g. deleted externally),
		// invalidate the cached view and retry once.
		if mod.View != nil && IsUndefinedTableError(err) {
			log.Warn("view missing in autocomplete, invalidating and retrying", zap.String("view", mod.View.TableExpr(spanCtx)))
			r.viewEngine.InvalidateView(spanCtx, mod)

			return r.Autocomplete(ctx, req, options)
		}
		return nil, err
	}

	rows := make([]interface{}, len(result))
	for i, model := range result {
		rows[i] = model
	}

	resp, err := autocompleteBuilder.BuildResponse(spanCtx, mod, rows, req.Order)
	if err != nil {
		log.Debug("error building autocomplete response", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	if options.PostHooks != nil {
		for _, hook := range options.PostHooks {
			err = hook(spanCtx, tx, result, &ExtraInfoReqResp[requestv1.AutocompleteRequest, requestv1.AutocompleteResponse]{
				Request:  req,
				Response: resp,
				UserId:   options.UserId,
			})
			if err != nil {
				log.Debug("error in post query handler", zap.Error(err))
				span.RecordError(err)
				return nil, err
			}
		}
	}

	return resp, nil
}

type GetExtraProps[M, REQ, RESP any] struct {
	UserId *string
	Req    *REQ
	Resp   *RESP

	Builder   SingularReadBuilderFunc[M, REQ, RESP]
	PostHooks []SingularReadPostHookFunc[M, REQ, RESP]
	SkipRLS   bool
}

func (r *Repository[M, REQ, RESP]) Get(ctx context.Context, id string, opts *GetExtraProps[M, REQ, RESP]) (*M, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "repository.Get")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("Get", zap.String("model", modelType.Name()), zap.Any("id", id))

	row := reflect.New(modelType).Elem().Interface().(M)
	mod, err := r.modelParser.ParseModel(spanCtx, &row)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	err = r.db.RunInTx(spanCtx, nil, func(ctx context.Context, tx bun.Tx) error {
		spanCtx, span, log := r.tracer.Start(ctx, "get-tx")
		defer span.End()
		err := AttachUserIdToTx(ctx, log, tx)
		if err != nil {
			log.Error("error attaching user id to tx", zap.Error(err))
			span.RecordError(err)
			return err
		}

		if !opts.SkipRLS {
			err = UseRLSRole(spanCtx, log, tx)
			if err != nil {
				log.Error("error using RLS role", zap.Error(err))
				span.RecordError(err)
				return err
			}
		} else if err = BypassRLS(spanCtx, log, tx); err != nil {
			span.RecordError(err)
			return err
		}

		var sq = tx.NewSelect()

		if mod.View == nil {
			sq = sq.Model(&row).Where("id = ?", id)
		} else {
			useViewErr := r.viewEngine.UseView(spanCtx, mod, row)
			if useViewErr != nil {
				log.Error("error using view", zap.Error(useViewErr))
				span.RecordError(useViewErr)
				return useViewErr
			}

			sq = sq.TableExpr(mod.TableName(ctx)).
				Where("?.? = ?", bun.Ident(mod.TableName(ctx)), bun.Ident("id"), id)
		}

		if opts != nil && opts.Builder != nil {
			sq, err = opts.Builder(sq, id, &ExtraInfoReq[REQ]{
				Request: opts.Req,
				UserId:  opts.UserId,
			})
			if err != nil {
				log.Debug("error building query", zap.Error(err))
				span.RecordError(err)
				return err
			}
		}

		err = sq.Scan(spanCtx, &row)
		if err != nil {
			log.Error("error scanning", zap.Error(err))
			log.Error(sq.String())
			span.RecordError(err)
			return err
		}

		if opts != nil && opts.PostHooks != nil {
			for _, hook := range opts.PostHooks {
				err = hook(spanCtx, tx, id, &row, &ExtraInfoReqResp[REQ, RESP]{
					Request:  opts.Req,
					Response: opts.Resp,
					UserId:   nil,
				})
				if err != nil {
					log.Debug("error in post query handler", zap.Error(err))
					span.RecordError(err)
					return err
				}
			}
		}
		return nil
	})

	if err != nil {
		// If the error is caused by a missing view (e.g. deleted externally),
		// invalidate the cached view and retry once.
		if mod.View != nil && IsUndefinedTableError(err) {
			log.Warn("view missing, invalidating and retrying", zap.String("view", mod.View.TableExpr(spanCtx)))
			r.viewEngine.InvalidateView(spanCtx, mod)

			retryResult, retryErr := r.Get(ctx, id, opts)
			if retryErr != nil {
				return nil, retryErr
			}
			return retryResult, nil
		}
		return nil, err
	}

	return &row, nil
}

type ListOptions[M any] struct {
	UserId *string

	Builder   MultiReadBuilderFunc[M, requestv1.SelectRequest, request.ListResponse[M]]
	PostHooks []MultiReadPostHookFunc[M, requestv1.SelectRequest, request.ListResponse[M]]

	Resp         *request.ListResponse[M]
	SkipRLS      bool
	IncludeCount bool
	CountOnly    bool
}

func (r *Repository[M, REQ, RESP]) List(ctx context.Context, req *requestv1.SelectRequest, opts *ListOptions[M]) (*request.ListResponse[M], error) {
	spanCtx, span, log := r.tracer.Start(ctx, "listViewMethod.ListView")
	defer span.End()

	viewType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("List", zap.String("model", viewType.Name()), zap.Any("req", req))

	row := reflect.New(viewType).Elem().Interface().(M)
	mod, err := r.modelParser.ParseModel(ctx, &row)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	listResp := request.NewListResponse[M]()

	err = r.db.RunInTx(spanCtx, nil, func(ctx context.Context, tx bun.Tx) error {
		err := AttachUserIdToTx(spanCtx, log, tx)
		if err != nil {
			log.Error("error attaching user id to tx", zap.Error(err))
			return err
		}

		if !opts.SkipRLS {
			err = UseRLSRole(spanCtx, log, tx)
			if err != nil {
				log.Error("error using RLS role", zap.Error(err))
				return err
			}
		} else if err = BypassRLS(spanCtx, log, tx); err != nil {
			return err
		}

		var sq *bun.SelectQuery = tx.NewSelect()

		if mod.View == nil {
			sq = sq.Model(&row)
		} else {
			useViewErr := r.viewEngine.UseView(spanCtx, mod, row)
			if useViewErr != nil {
				log.Error("error using view", zap.Error(useViewErr))
				span.RecordError(useViewErr)
				return useViewErr
			}

			sq = sq.TableExpr(mod.TableName(ctx))
		}

		err = BuildSelectQuery(ctx, req, sq, mod)
		if err != nil {
			log.Error("error building view query", zap.Error(err))
			span.RecordError(err)
			return err
		}

		if opts.Builder != nil {
			sq, err = opts.Builder(sq, &ExtraInfoReq[requestv1.SelectRequest]{
				Request: req,
				UserId:  opts.UserId,
			})
			if err != nil {
				log.Debug("error building query", zap.Error(err))
				span.RecordError(err)
				return err
			}
		}

		log.Debug("select query", zap.String("sql", sq.String()))

		if req.Pagination == nil {
			req.Pagination = &requestv1.Pagination{
				Take: 10,
				Skip: 0,
			}
		}

		var count int
		result := make([]*M, 0)

		if !opts.CountOnly {
			err = sq.Scan(spanCtx, &result)
			if err != nil {
				if !errors.Is(err, sql.ErrNoRows) {
					log.Error("error selecting list query", zap.Error(err))
					span.RecordError(err)
					return err
				}
			}
		}

		if opts.IncludeCount {
			count, err = sq.Count(spanCtx)
			if err != nil {
				log.Error("error counting list query", zap.Error(err))
				span.RecordError(err)
				return err
			}
		}

		var page int32
		if req.Pagination.Take > 0 {
			page = req.Pagination.Skip / req.Pagination.Take
		}

		listResp.Items = result
		listResp.Pagination.Page = page
		if opts.IncludeCount {
			listResp.Pagination.Total = int32(count)
		}

		if opts.PostHooks != nil {
			for _, hook := range opts.PostHooks {
				err = hook(spanCtx, tx, result, &ExtraInfoReqResp[requestv1.SelectRequest, request.ListResponse[M]]{
					Request:  req,
					Response: listResp,
					UserId:   opts.UserId,
				})
				if err != nil {
					log.Error("error in post query handler", zap.Error(err))
					span.RecordError(err)
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		// If the error is caused by a missing view (e.g. deleted externally),
		// invalidate the cached view and retry once.
		if mod.View != nil && IsUndefinedTableError(err) {
			log.Warn("view missing, invalidating and retrying", zap.String("view", mod.View.TableExpr(spanCtx)))
			r.viewEngine.InvalidateView(spanCtx, mod)

			retryResp, retryErr := r.List(ctx, req, opts)
			if retryErr != nil {
				return nil, retryErr
			}
			return retryResp, nil
		}
		return nil, err
	}

	return listResp, nil
}

type CreateExtraProps[M, REQ, RESP any] struct {
	Req    *REQ
	Resp   *RESP
	UserId *string

	ManualQuery ManualQueryFunc[M, REQ]
	PreHooks    []MutationPreHookFunc[M, REQ]
	PostHooks   []MutationPostHookFunc[M, REQ, RESP]
	Transaction *bun.Tx
	SkipRLS     bool
}

func (r *Repository[M, REQ, RESP]) Create(ctx context.Context, m *M, opts *CreateExtraProps[M, REQ, RESP]) (*M, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "create")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("Create", zap.String("model", modelType.Name()))

	userID := opts.UserId

	row := m

	setFieldIfExists(reflect.ValueOf(row), "CreatedBy", userID)
	setFieldIfExists(reflect.ValueOf(row), "CreatedAt", unix.Now())

	var tx bun.Tx
	var txErr error
	if opts.Transaction != nil {
		tx = *opts.Transaction
	} else if opts.ManualQuery == nil {
		tx, txErr = r.db.BeginTx(spanCtx, nil)
	}

	rollback := func() {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Error("error rolling back transaction", zap.Error(rollbackErr))
			span.RecordError(rollbackErr)
		}
	}

	err := AttachUserIdToTx(spanCtx, log, tx)
	if err != nil {
		log.Error("error attaching user id to tx", zap.Error(err))
		rollback()
		return nil, err
	}

	if !opts.SkipRLS {
		err = UseRLSRole(spanCtx, log, tx)
		if err != nil {
			log.Error("error using RLS role", zap.Error(err))
			rollback()
			return nil, err
		}
	} else if err = BypassRLS(spanCtx, log, tx); err != nil {
		rollback()
		return nil, err
	}

	if opts.ManualQuery != nil {
		err := opts.ManualQuery(spanCtx, row, &ExtraInfoReq[REQ]{
			Request: opts.Req,
			UserId:  opts.UserId,
		})
		if err != nil {
			log.Error("error in manual query", zap.Error(err))
			span.RecordError(err)
			return nil, err
		}
	} else {
		if txErr != nil {
			log.Error("error starting transaction", zap.Error(txErr))
			span.RecordError(txErr)
			return nil, txErr
		}

		if opts.PreHooks != nil {
			for _, hook := range opts.PreHooks {
				err := hook(spanCtx, tx, row, &ExtraInfoReq[REQ]{
					Request: opts.Req,
					UserId:  opts.UserId,
				})
				if err != nil {
					log.Error("error in pre query hook", zap.Error(err))
					span.RecordError(err)
					rollback()
					return nil, err
				}
			}
		}

		err := tx.NewInsert().Model(row).Returning("*").Scan(spanCtx, row)
		if err != nil {
			log.Error("error inserting", zap.Error(err))
			span.RecordError(err)
			rollback()
			return nil, err
		}
	}

	if opts.ManualQuery != nil && opts.PostHooks != nil {
		log.Error("cannot use post hooks with manual query post hooks are being skipped please address the issue")
	}

	if opts.ManualQuery == nil {
		if opts.PostHooks != nil {
			for _, hook := range opts.PostHooks {
				err := hook(spanCtx, tx, row, &ExtraInfoReqResp[REQ, RESP]{
					Request:  opts.Req,
					Response: opts.Resp,
					UserId:   opts.UserId,
				})
				if err != nil {
					log.Error("error in post query hook", zap.Error(err))
					span.RecordError(err)
					rollback()
					return nil, err
				}
			}
		}

		if err := tx.Commit(); err != nil {
			log.Error("error committing transaction", zap.Error(err))
			span.RecordError(err)
			return nil, err
		}
	}

	return row, nil
}

type UpdateOptions[M, REQ, RESP any] struct {
	Req            *REQ
	Resp           *RESP
	UserId         *string
	ExcludeColumns []string

	ManualQuery ManualQueryFunc[M, REQ]
	PreHooks    []MutationPreHookFunc[M, REQ]
	PostHooks   []MutationPostHookFunc[M, REQ, RESP]
	Transaction *bun.Tx
	SkipRLS     bool
}

func (r *Repository[M, REQ, RESP]) Update(ctx context.Context, m *M, opts *UpdateOptions[M, REQ, RESP]) (*M, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "update")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("update", zap.String("model", modelType.Name()))

	userId := opts.UserId

	mod, err := r.modelParser.ParseModel(ctx, m)
	if err != nil {
		log.Error("error parsing model", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	var excludeColumns = make([]string, 0)
	if opts.ExcludeColumns != nil {
		excludeColumns = append(excludeColumns, opts.ExcludeColumns...)
	}

	for _, field := range mod.BunTable.DataFields {
		switch field.GoName {
		case "CreatedBy", "CreatedAt", "DeletedBy", "DeletedAt":
			excludeColumns = append(excludeColumns, field.Name)

		case "UpdatedBy":
			setFieldIfExists(reflect.ValueOf(m), "UpdatedBy", userId)

		case "UpdatedAt":
			setFieldIfExists(reflect.ValueOf(m), "UpdatedAt", unix.NowPtr())
		}
	}

	var tx bun.Tx
	var txErr error
	if opts.Transaction != nil {
		tx = *opts.Transaction
	} else if opts.ManualQuery == nil {
		tx, txErr = r.db.BeginTx(spanCtx, nil)
	}

	rollback := func() {
		if rollbackErr := tx.Rollback(); err != nil {
			log.Error("error rolling back transaction", zap.Error(rollbackErr))
			span.RecordError(rollbackErr)
		}
	}

	err = AttachUserIdToTx(spanCtx, log, tx)
	if err != nil {
		log.Error("error attaching user id to tx", zap.Error(err))
		rollback()
		return nil, err
	}

	if !opts.SkipRLS {
		err = UseRLSRole(spanCtx, log, tx)
		if err != nil {
			log.Error("error using RLS role", zap.Error(err))
			rollback()
			return nil, err
		}
	} else if err = BypassRLS(spanCtx, log, tx); err != nil {
		rollback()
		return nil, err
	}

	if opts.ManualQuery != nil {
		err = opts.ManualQuery(spanCtx, m, &ExtraInfoReq[REQ]{
			Request: opts.Req,
			UserId:  opts.UserId,
		})
		if err != nil {
			log.Error("error in manual query", zap.Error(err))
			span.RecordError(err)
			return nil, err
		}
	} else {
		if txErr != nil {
			log.Error("error starting transaction", zap.Error(txErr))
			span.RecordError(txErr)
			return nil, txErr
		}

		if opts.PreHooks != nil {
			for _, hook := range opts.PreHooks {
				err = hook(spanCtx, tx, m, &ExtraInfoReq[REQ]{
					Request: opts.Req,
					UserId:  opts.UserId,
				})
				if err != nil {
					log.Error("error in pre query hook", zap.Error(err))
					span.RecordError(err)
					rollback()
					return nil, err
				}
			}
		}

		excludeColumns = util.Unique(excludeColumns)

		err = tx.NewUpdate().
			Model(m).
			ExcludeColumn(excludeColumns...).
			WherePK().
			Returning("*").
			Scan(spanCtx, m)
		if err != nil {
			log.Error("error updating", zap.Error(err))
			span.RecordError(err)
			return nil, err
		}
	}

	if opts.ManualQuery != nil && opts.PostHooks != nil {
		log.Error("cannot use post hooks with manual query post hooks are being skipped please address the issue")
	}

	if opts.ManualQuery == nil {
		if opts.PostHooks != nil {
			for _, hook := range opts.PostHooks {
				err = hook(spanCtx, tx, m, &ExtraInfoReqResp[REQ, RESP]{
					Request:  opts.Req,
					Response: opts.Resp,
					UserId:   nil,
				})
				if err != nil {
					log.Error("error in post query hook", zap.Error(err))
					span.RecordError(err)
					rollback()
					return nil, err
				}
			}
		}

		if err = tx.Commit(); err != nil {
			log.Error("error committing transaction", zap.Error(err))
			span.RecordError(err)
			return nil, err
		}
	}

	return m, nil
}

type SoftDeleteOptions[M any] struct {
	UserId *string
	Req    *requestv1.DeleteRequest
	Resp   *requestv1.DeleteResponse

	PostHooks   []DeletePostHookFunc[M]
	Transaction *bun.Tx
	SkipRLS     bool
}

func (r *Repository[M, REQ, RESP]) SoftDelete(ctx context.Context, ids []string, opts *SoftDeleteOptions[M]) (*requestv1.DeleteResponse, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "softDelete")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("SoftDelete", zap.String("model", modelType.Name()))

	resp := opts.Resp

	userId := opts.UserId

	rowInstance := reflect.New(modelType).Elem().Interface().(M)

	var tx bun.Tx
	var txErr error
	if opts.Transaction != nil {
		tx = *opts.Transaction
	} else {
		tx, txErr = r.db.BeginTx(spanCtx, nil)
	}

	if txErr != nil {
		log.Error("error starting transaction", zap.Error(txErr))
		span.RecordError(txErr)
		return nil, txErr
	}

	rollback := func() {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Error("error rolling back transaction", zap.Error(rollbackErr))
			span.RecordError(rollbackErr)
		}
	}

	err := AttachUserIdToTx(spanCtx, log, tx)
	if err != nil {
		log.Error("error attaching user id to tx", zap.Error(err))
		rollback()
		return nil, err
	}
	if !opts.SkipRLS {
		err = UseRLSRole(spanCtx, log, tx)
		if err != nil {
			log.Error("error using RLS role", zap.Error(err))
			rollback()
			return nil, err
		}
	} else if err = BypassRLS(spanCtx, log, tx); err != nil {
		rollback()
		return nil, err
	}

	var sqlResult sql.Result
	var deleted []*M

	if opts.PostHooks == nil {
		sqlResult, err = tx.NewUpdate().
			Model(&rowInstance).
			Set("deleted_at = ?", unix.NowPtr()).
			Set("deleted_by = ?", &userId).
			Where("id IN (?)", bun.In(ids)).
			Exec(spanCtx)
	} else {
		sqlResult, err = tx.NewUpdate().
			Model(&rowInstance).
			Set("deleted_at = ?", unix.NowPtr()).
			Set("deleted_by = ?", &userId).
			Where("id IN (?)", bun.In(ids)).
			Returning("*").
			Exec(spanCtx, &deleted)
	}
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			rollback()
			return resp, nil
		}
		log.Error("error deleting", zap.Error(err))
		span.RecordError(err)
		rollback()
		return nil, err
	}

	ra, err := sqlResult.RowsAffected()
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return resp, nil
		}
		log.Error("error getting rows affected", zap.Error(err))
		span.RecordError(err)
		rollback()
		return nil, err
	}

	resp.RowsAffected = int32(ra)

	if opts.PostHooks != nil {
		for _, hook := range opts.PostHooks {
			if err = hook(spanCtx, tx, deleted, &ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]{
				Request:  opts.Req,
				Response: resp,
				UserId:   opts.UserId,
			}); err != nil {
				log.Error("error in post query hook", zap.Error(err))
				span.RecordError(err)
				rollback()
				return nil, err
			}
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error("error committing transaction", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	return resp, nil
}

type DeleteOptions[M any] struct {
	UserId *string
	Req    *requestv1.DeleteRequest
	Resp   *requestv1.DeleteResponse

	PostHooks   []DeletePostHookFunc[M]
	Transaction *bun.Tx
	SkipRLS     bool
}

func (r *Repository[M, REQ, RESP]) Delete(ctx context.Context, ids []string, opts *DeleteOptions[M]) (*requestv1.DeleteResponse, error) {
	spanCtx, span, log := r.tracer.Start(ctx, "delete")
	defer span.End()

	modelType := reflect.TypeOf((*M)(nil)).Elem()

	log.Debug("Delete", zap.String("model", modelType.Name()))

	resp := &requestv1.DeleteResponse{
		RowsAffected: 0,
	}

	rowInstance := reflect.New(modelType).Elem().Interface().(M)

	var tx bun.Tx
	var txErr error
	if opts.Transaction != nil {
		tx = *opts.Transaction
	} else {
		tx, txErr = r.db.BeginTx(spanCtx, nil)
	}

	if txErr != nil {
		log.Error("error starting transaction", zap.Error(txErr))
		span.RecordError(txErr)
		return nil, txErr
	}

	rollback := func() {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Error("error rolling back transaction", zap.Error(rollbackErr))
			span.RecordError(rollbackErr)
		}
	}

	err := AttachUserIdToTx(spanCtx, log, tx)
	if err != nil {
		log.Error("error attaching user id to tx", zap.Error(err))
		rollback()
		return nil, err
	}
	if !opts.SkipRLS {
		err = UseRLSRole(spanCtx, log, tx)
		if err != nil {
			log.Error("error using RLS role", zap.Error(err))
			rollback()
			return nil, err
		}
	} else if err = BypassRLS(spanCtx, log, tx); err != nil {
		rollback()
		return nil, err
	}

	var deleted []*M
	var sqlResult sql.Result

	if opts.PostHooks == nil {
		sqlResult, err = tx.NewDelete().Model(&rowInstance).
			Where("id IN (?)", bun.In(ids)).Exec(spanCtx)

	} else {
		sqlResult, err = r.db.NewDelete().Model(&rowInstance).
			Where("id IN (?)", bun.In(ids)).
			Returning("*").
			Exec(spanCtx, &deleted)
	}
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			rollback()
			return resp, nil
		}
		log.Error("error deleting", zap.Error(err))
		span.RecordError(err)
		rollback()
		return nil, err
	}

	ra, err := sqlResult.RowsAffected()
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return resp, nil
		}
		log.Error("error getting rows affected", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	resp.RowsAffected = int32(ra)

	if opts.PostHooks != nil {
		for _, hook := range opts.PostHooks {
			err = hook(spanCtx, tx, deleted, &ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]{
				Request:  opts.Req,
				Response: opts.Resp,
				UserId:   opts.UserId,
			})
			if err != nil {
				log.Error("error in post query hook", zap.Error(err))
				span.RecordError(err)
				rollback()
				return nil, err
			}
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error("error committing transaction", zap.Error(err))
		span.RecordError(err)
		return nil, err
	}

	return resp, nil
}

func (r *Repository[M, REQ, RESP]) ParseModel(ctx context.Context, m *M) (*Model, error) {
	return r.modelParser.ParseModel(ctx, m)
}

type RunExtraProps struct {
	SkipRLS bool
}

func (r *Repository[M, REQ, RESP]) Run(ctx context.Context, run func(ctx context.Context, tx bun.Tx) error, opts ...RunExtraProps) error {
	var skipRLS = false
	if len(opts) > 0 {
		if opts[0].SkipRLS {
			skipRLS = true
		}
	}
	return r.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		log := zap.L()
		err := AttachUserIdToTx(ctx, log, tx)
		if err != nil {
			log.Error("error attaching user id to tx", zap.Error(err))
			return err
		}

		if !skipRLS {
			err = UseRLSRole(ctx, log, tx)
			if err != nil {
				log.Error("error using RLS role", zap.Error(err))
				return err
			}
		} else if err = BypassRLS(ctx, log, tx); err != nil {
			return err
		}
		return run(ctx, tx)
	})
}

// UseRLSRole is intentionally a no-op. RLS enforcement no longer switches to a
// dedicated rls_enabled_role — that role, and the role-scoped policies that
// needed it, were removed. The app connects as a non-owner role that is directly
// subject to the (now uniformly PUBLIC) policies; privileged paths bypass via
// BypassRLS. Kept as a no-op so the enforce-path call sites don't need to change.
func UseRLSRole(ctx context.Context, log *zap.Logger, tx bun.Tx) error {
	return nil
}

// BypassRLS marks the current transaction as exempt from row-level security for
// the "run without RLS" (SkipRLS) paths — service operations such as the
// pre-auth login lookup that must read rows across all users. On the Zalando
// cluster this relied on the connection role holding the BYPASSRLS attribute;
// Aurora/RDS grants BYPASSRLS to no role, so instead we set a transaction-local
// session flag that core.can() short-circuits on (see the core RLS migrations).
// Uses set_config with is_local=true, mirroring how core.user is set.
func BypassRLS(ctx context.Context, log *zap.Logger, tx bun.Tx) error {
	_, err := tx.ExecContext(ctx, "SELECT set_config('core.bypass', 'on', true)")
	if err != nil {
		log.Error("failed to set core.bypass for SkipRLS transaction", zap.Error(err))
	}
	return err
}
