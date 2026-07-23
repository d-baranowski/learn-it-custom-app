package repository

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"pkg/base"
	"pkg/ctxHelpers"
	"pkg/maps"
	"pkg/tracing"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var viewAlreadyExistsRegex = regexp.MustCompile(`.*already exists*`)

// isUndefinedTableError returns true when the PostgreSQL error indicates
// that a relation (table/view) does not exist (SQLSTATE 42P01).
func isUndefinedTableError(err error) bool {
	if err == nil {
		return false
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "42P01"
	}
	return strings.Contains(err.Error(), "does not exist")
}

type ViewEngine struct {
	db          *bun.DB
	dev         bool
	initialised *maps.SafeMap[string, bool]
	version     string
	tracer      *tracing.Tracer
	labeler     AutoLabeler
	modelParser ModelParser
}

type ViewEngineProps struct {
	fx.In

	Labeler     AutoLabeler
	DB          *bun.DB
	Env         *base.ServiceEnv
	ModelParser ModelParser
}

func ViewEngineProvider(props ViewEngineProps) (*ViewEngine, error) {
	viewEngine := &ViewEngine{
		db:          props.DB,
		dev:         props.Env.IsDev(),
		initialised: maps.NewSafeMap[string, bool](),
		tracer:      tracing.NewTracer("api.viewEngine"),
		labeler:     props.Labeler,
	}

	return viewEngine, nil
}

func (ve *ViewEngine) ClearInitialised() {
	ve.initialised = maps.NewSafeMap[string, bool]()
}

// InvalidateView removes the cached initialisation flag for a model's view
// so that the next call to UseView will drop and re-create it. This is used
// for error recovery when a view has been deleted externally.
func (ve *ViewEngine) InvalidateView(ctx context.Context, mod *Model) {
	lang := ctxHelpers.GetLanguageFromContext(ctx)
	ve.initialised.Delete(mod.View.TableName + "_" + lang)
}

// IsUndefinedTableError is exported so callers (e.g. Repository) can check
// whether a query error is caused by a missing view/table.
func IsUndefinedTableError(err error) bool {
	return isUndefinedTableError(err)
}

func (ve *ViewEngine) GetViewName(ctx context.Context, row interface{}) (string, error) {
	v, err := ve.GetView(ctx, row)
	if err != nil {
		return "", err
	}
	return v.TableExpr(ctx), nil
}

func (ve *ViewEngine) GetView(ctx context.Context, row interface{}) (*ModelView, error) {
	m, err := ve.modelParser.ParseModel(ctx, row)
	if err != nil {
		return nil, err
	}

	err = ve.UseView(ctx, m, row)
	if err != nil {
		return nil, err
	}

	return m.View, nil
}

func (ve *ViewEngine) UseView(ctx context.Context, mod *Model, row interface{}) error {
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	if _, ok := ve.initialised.Get(mod.View.TableName + "_" + lang); ok {
		return nil
	}

	spanCtx, span, log := ve.tracer.Start(ctx, "useView")
	defer span.End()

	if mod.AutoLabel {
		err := ve.labeler.AutoLabel(spanCtx, mod, row)
		if err != nil {
			log.Error("error auto labelling", zap.Error(err))
			span.RecordError(err)
			return err
		}
	}

	if mod.View.Version == "" {
		// Build the hash from the SQL query and the model's field list.
		// Including field names ensures that schema changes (new/removed
		// columns) produce a different version hash even when the SQL
		// uses "table.*" and hasn't changed textually.
		hashInput := mod.View.Query.String()
		for pair := mod.RpcFields.Oldest(); pair != nil; pair = pair.Next() {
			hashInput += "\x00" + pair.Value.DbName
		}
		mod.View.Version = fmt.Sprintf("%x", sha256.Sum256([]byte(hashInput)))

		// trim version to 12 characters
		if len(mod.View.Version) > 12 {
			mod.View.Version = mod.View.Version[:12]
		}
	}

	// The view name encodes a content-derived hash, so any change to the
	// view definition produces a brand-new name. If a view with the
	// current hashed name already exists in the database, its definition
	// must match what we're about to install — there's no work to do.
	// Skip the DROP/CREATE round-trip entirely.
	//
	// If the view doesn't exist yet (process startup, schema change), we
	// fall through to CREATE VIEW after first sweeping any stale views
	// from earlier hashes for the same base table. This applies in both
	// dev and prod: there's no good reason to force recreation in dev
	// since the hash already invalidates outdated definitions.
	var exists bool
	sq := ve.db.NewSelect().ColumnExpr("exists(select 1 from information_schema.views where table_schema = ? and table_name = ?)", mod.View.Schema, mod.View.VersionedName(spanCtx))

	err := sq.Scan(spanCtx, &exists)
	if err != nil {
		log.Error("error checking if view exists", zap.Error(err))
		span.RecordError(err)
		return err
	}

	if exists {
		ve.initialised.Set(mod.View.TableName+"_"+lang, true)
		return nil
	}

	// The current versioned view does not exist. Drop any stale views
	// for the same base table so we don't accumulate orphaned views
	// after schema changes.
	ve.dropStaleViews(spanCtx, log, mod, lang)

	viewSql := "CREATE VIEW " + mod.View.TableExpr(ctx) + " WITH (security_barrier = true, security_invoker = true) AS " + mod.View.Query.String()
	_, err = ve.db.NewRaw(viewSql).Exec(spanCtx)
	if err != nil {
		if viewAlreadyExistsRegex.MatchString(err.Error()) {
			ve.initialised.Set(mod.View.TableName+"_"+lang, true)
			return nil
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if viewAlreadyExistsRegex.MatchString(pgErr.Detail) {
				ve.initialised.Set(mod.View.TableName+"_"+lang, true)
				return nil
			}
		}

		log.Error("error creating view", zap.Error(err))
		span.RecordError(err)
		return err
	}

	ve.initialised.Set(mod.View.TableName+"_"+lang, true)

	return nil
}

// dropStaleViews removes old versioned views for the same base table and
// language. This prevents accumulation of orphaned views after schema
// changes that produce a new version hash.
func (ve *ViewEngine) dropStaleViews(ctx context.Context, log *zap.Logger, mod *Model, lang string) {
	// Pattern: <table_name>_<12-char-hash>_<lang>
	// We look for any view whose name starts with "<table_name>_" and ends
	// with "_<lang>" but does NOT match the current versioned name.
	prefix := mod.View.TableName + "_"
	suffix := "_" + lang
	currentName := mod.View.VersionedName(ctx)

	var staleViews []string
	err := ve.db.NewSelect().
		ColumnExpr("table_name").
		TableExpr("information_schema.views").
		Where("table_schema = ?", mod.View.Schema).
		Where("table_name LIKE ?", prefix+"%"+suffix).
		Where("table_name != ?", currentName).
		Scan(ctx, &staleViews)
	if err != nil {
		log.Warn("error querying stale views for cleanup", zap.Error(err))
		return
	}

	for _, name := range staleViews {
		fullName := mod.View.Schema + "." + name
		_, dropErr := ve.db.NewRaw("DROP VIEW IF EXISTS " + fullName).Exec(ctx)
		if dropErr != nil {
			log.Warn("error dropping stale view", zap.String("view", fullName), zap.Error(dropErr))
		} else {
			log.Info("dropped stale view", zap.String("view", fullName))
		}
	}
}
