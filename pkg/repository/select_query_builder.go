package repository

import (
	"context"
	"errors"
	"fmt"
	requestv1 "pkg/request/gen/request/v1"
	"strings"

	"github.com/uptrace/bun"
)

// applyOrderBy applies ordering to a select query based on OrderBy directives
func applyOrderBy(ctx context.Context, sq *bun.SelectQuery, model *Model, orders []*requestv1.OrderBy) error {
	if orders == nil || len(orders) == 0 {
		return nil
	}

	modTableName := model.TableName(ctx)

	for _, order := range orders {
		var direction string
		switch order.Direction {
		case 0:
			direction = "ASC NULLS FIRST"
		case 1:
			direction = "DESC NULLS LAST"
		default:
			return fmt.Errorf("invalid order value: %d", order.Direction)
		}

		parts := strings.Split(order.Field, ".")
		if len(parts) == 1 {
			field, ok := model.GetRpcField(order.Field)
			if !ok {
				return fmt.Errorf("field %s not found", order.Field)
			}

			if field.OrderBy != nil {
				sq.OrderExpr(*field.OrderBy+direction, bun.Ident(field.ColumnSQL(&modTableName)))
			} else {
				sq.OrderExpr("? "+direction, bun.Ident(field.ColumnSQL(&modTableName)))
			}

		} else {
			panic("relation fields not supported")
		}
	}

	return nil
}

func BuildSelectQuery(ctx context.Context, req *requestv1.SelectRequest, sq *bun.SelectQuery, model *Model) error {
	if req == nil {
		return errors.New("request is required")
	}

	if model == nil {
		return errors.New("model is required")
	}

	modTableName := model.TableName(ctx)

	fields := make([]string, 0)

	if req.SelectAll {
		for _, field := range model.GetRpcFields() {
			sq.Column(field.ColumnSQL(&modTableName))
		}
	} else {
		for _, s := range req.Select {
			parts := strings.Split(s, ".")
			if len(parts) == 1 {

				field, ok := model.GetRpcField(s)
				if !ok {
					return fmt.Errorf("field %s not found", s)
				}

				if field.Model == nil || field.IsJsonB {
					fields = append(fields, field.ColumnSQL(&modTableName))
				} else {
					panic("relation fields not supported yet")
				}

			} else {
				panic("relation fields not supported")
			}
		}
		sq.Column(fields...)
	}

	if deletedAtField, deletedAtExists := model.GetRpcField("deletedAt"); deletedAtExists {
		deletedState := req.DeletedState
		if req.DeletedState == 0 {
			deletedState = requestv1.DeletedState_DS_NOT_DELETED
		}

		column := bun.Ident(deletedAtField.ColumnSQL(&modTableName))

		switch deletedState {
		case requestv1.DeletedState_DS_NOT_DELETED:
			sq.Where("? IS NULL", column)
		case requestv1.DeletedState_DS_ONLY_DELETED:
			sq.Where("? IS NOT NULL", column)
		case requestv1.DeletedState_DS_ALL:
			// Do nothing
		default:
			return fmt.Errorf("invalid deleted state: %d", deletedState)
		}
	}

	if req.Where != nil {
		if err := whereBuilder(ctx, sq.QueryBuilder(), model, req.Where); err != nil {
			return err
		}
	}

	if err := applyOrderBy(ctx, sq, model, req.Order); err != nil {
		return err
	}

	// If the caller didn't specify an explicit ORDER BY, add a stable
	// default. Without it, paginated lists are non-deterministic across
	// pages (Postgres is free to return rows in any order) and the
	// planner can't use ordered indexes — so the new partial pagination
	// indexes on (created_at DESC) WHERE deleted_at IS NULL are dead
	// weight for the common "list all active" path.
	//
	// Fall back to the primary key when the model has no created_at,
	// which keeps the ordering deterministic for entities that don't
	// track creation time (e.g. some junction tables).
	if len(req.Order) == 0 {
		if createdAt, ok := model.GetRpcField("createdAt"); ok {
			sq.OrderExpr("? DESC", bun.Ident(createdAt.ColumnSQL(&modTableName)))
		}
		if idField, ok := model.GetRpcField("id"); ok {
			sq.OrderExpr("? DESC", bun.Ident(idField.ColumnSQL(&modTableName)))
		}
	}

	if req.Pagination != nil {
		sq.Offset(int(req.Pagination.Skip)).Limit(int(req.Pagination.Take))
	}

	return nil
}
