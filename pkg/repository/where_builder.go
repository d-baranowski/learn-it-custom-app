package repository

import (
	"context"
	"fmt"
	"pkg/request"
	requestv1 "pkg/request/gen/request/v1"
	"strings"

	jsoniter "github.com/json-iterator/go"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func whereBuilder(ctx context.Context, q bun.QueryBuilder, model *Model, group *requestv1.Where) (err error) {
	if group == nil {
		return
	}

	if len(group.GetConditions()) == 0 {
		return
	}

	var sep string
	switch group.Mode {
	case requestv1.Where_AND:
		sep = " AND "
	case requestv1.Where_OR:
		sep = " OR "
	default:
		return fmt.Errorf("invalid operator: %s", group.Mode.String())
	}

	zap.L().Debug(fmt.Sprintf("whereBuilder: adding WhereGroup with %s operator", sep))

	modTableName := model.TableName(ctx)

	var noOpQuery bun.QueryBuilder

	// get the underlying type of q to create a no-op query
	switch q.Operation() {
	case "SELECT":
		noOpQuery = bun.NewSelectQuery(NoopDB).QueryBuilder()
	case "UPDATE":
		panic("update not supported")
	case "DELETE":
		panic("delete not supported")
	}

	q = q.WhereGroup(sep, func(q bun.QueryBuilder) bun.QueryBuilder {

		for _, condition := range group.GetConditions() {

			if condition.GetClause() != nil {
				if clause := condition.GetClause(); clause != nil {
					var val []interface{}
					if err = jsoniter.UnmarshalFromString(clause.Value, &val); err != nil {
						return noOpQuery
					}

					// if there is a . then we'll assume it's a jsonb field
					fieldName := clause.Field
					if strings.Contains(clause.Field, ".") {
						fieldName = strings.Split(clause.Field, ".")[0]
					}

					field, fieldExists := model.GetRpcField(fieldName)
					if !fieldExists {
						panic(fmt.Sprintf("field %s not found", clause.Field))
					}

					column := bun.Ident(field.ColumnSQL(&modTableName))

					if field.IsJsonB {
						// path removes the fieldName and . from the start of the clause.Field.
						// When there is no sub-path (no dot), path is left empty so that
						// addWhereClauseJSONB can fall back to a full-object cast (e.g. ::text).
						path := ""
						if strings.Contains(clause.Field, ".") {
							path = strings.TrimPrefix(clause.Field, fieldName+".")
						}
						if err = addWhereClauseJSONB(q, clause.Operator, column, path, val, group.Mode); err != nil {
							return noOpQuery
						}
					} else if field.IsArray {
						if err = addWhereClauseArray(q, clause.Operator, column, val, group.Mode); err != nil {
							return noOpQuery
						}
					} else {
						if err = addWhereClause(q, clause.Operator, column, val, group.Mode); err != nil {
							return noOpQuery
						}
					}
				}

			} else if condition.GetGroup() != nil {
				if err = whereBuilder(ctx, q, model, condition.GetGroup()); err != nil {
					return noOpQuery
				}

			} else if condition.GetSubQuery() != nil {
				panic("subquery not supported")
			}
		}
		return q
	})

	return
}

type WhereFunc func(format string, args ...interface{}) bun.QueryBuilder

func addWhereClause(q bun.QueryBuilder, op requestv1.WhereOperator, column bun.Ident, val []interface{}, mode requestv1.Where_Mode) error {

	var whereMethod WhereFunc
	var debugMode string

	if mode == requestv1.Where_OR {
		debugMode = "OR"
		whereMethod = q.WhereOr
	} else {
		debugMode = "AND"
		whereMethod = q.Where
	}

	zap.L().Debug(fmt.Sprintf("addWhereClause: %s %s %s %s", debugMode, column, op, val))

	switch op {

	case requestv1.WhereOperator_LIKE, requestv1.WhereOperator_NLIKE, requestv1.WhereOperator_ILIKE, requestv1.WhereOperator_NILIKE:
		whereMethod(fmt.Sprintf("? %s ?", request.OperatorSql(op)), column, fmt.Sprintf("%%%s%%", unpackValue(val[0])))

	case requestv1.WhereOperator_STARTSWITH, requestv1.WhereOperator_NSTARTSWITH, requestv1.WhereOperator_ISTARTSWITH, requestv1.WhereOperator_NISTARTSWITH:
		whereMethod(fmt.Sprintf("? %s ?", request.OperatorSql(op)), column, fmt.Sprintf("%s%%", unpackValue(val[0])))

	case requestv1.WhereOperator_ENDSWITH, requestv1.WhereOperator_NENDSWITH, requestv1.WhereOperator_IENDSWITH, requestv1.WhereOperator_NIENDSWITH:
		whereMethod(fmt.Sprintf("? %s ?", request.OperatorSql(op)), column, fmt.Sprintf("%%%s", unpackValue(val[0])))

	case requestv1.WhereOperator_ISNULL:
		whereMethod(fmt.Sprintf("? %s", request.OperatorSql(op)), column)

	case requestv1.WhereOperator_NOTNULL:
		whereMethod(fmt.Sprintf("? %s", request.OperatorSql(op)), column)

		//case requestv1.WhereOperator_IN, requestv1.WhereOperator_NIN:
	//		whereMethod(fmt.Sprintf("? %s (?)", OperatorSql(op)), column, bun.In(val))

	case requestv1.WhereOperator_COL_IN_VAL, requestv1.WhereOperator_COL_NIN_VAL:
		whereMethod(fmt.Sprintf("? %s (?)", request.OperatorSql(op)), column, bun.In(val))

	case requestv1.WhereOperator_VAL_IN_COL, requestv1.WhereOperator_VAL_NIN_COL:
		whereMethod(fmt.Sprintf("? %s (?)", request.OperatorSql(op)), val, bun.In(column))

	// 234 = ANY ("country"."mcc"); or @> ARRAY[234]

	//case requestv1.WhereOperator_IN, requestv1.WhereOperator_NIN:
	//	whereMethod("? = ANY (?)", bun.In(val), column)

	// todo: going to need where value in column operator

	case requestv1.WhereOperator_BETWEEN, requestv1.WhereOperator_NBETWEEN:
		if len(val) != 2 {
			return fmt.Errorf("invalid number of values for operator %s: %d", op, len(val))
		}
		whereMethod(fmt.Sprintf("? %s ? AND ?", request.OperatorSql(op)), column, val[0], val[1])

	case requestv1.WhereOperator_BITWISEAND:
		whereMethod(fmt.Sprintf("(? %s ?) > 0", request.OperatorSql(op)), column, val[0])

	case requestv1.WhereOperator_NBITWISEAND:
		whereMethod(fmt.Sprintf("(? %s ?) = 0", request.OperatorSql(op)), column, val[0])

	case requestv1.WhereOperator_BITWISEOR:
		whereMethod(fmt.Sprintf("(? %s ?) > 0", request.OperatorSql(op)), column, val[0])

	case requestv1.WhereOperator_NBITWISEOR:
		whereMethod(fmt.Sprintf("(? %s ?) = 0", request.OperatorSql(op)), column, val[0])

	default:
		whereMethod(fmt.Sprintf("? %s ?", request.OperatorSql(op)), column, val[0])
	}

	return nil
}

func addWhereClauseArray(q bun.QueryBuilder, op requestv1.WhereOperator, column bun.Ident, val []interface{}, mode requestv1.Where_Mode) error {
	var whereMethod WhereFunc

	if mode == requestv1.Where_OR {
		whereMethod = q.WhereOr
	} else {
		whereMethod = q.Where
	}

	switch op {
	case requestv1.WhereOperator_EQ:
		whereMethod("? = ANY (?)", val[0], column)
	case requestv1.WhereOperator_NEQ:
		whereMethod("? != ALL (?)", val[0], column)
	default:
		return fmt.Errorf("operator %s is not supported for array fields", op)
	}

	return nil
}

func addWhereClauseJSONB(q bun.QueryBuilder, op requestv1.WhereOperator, column bun.Ident, path string, val []interface{}, mode requestv1.Where_Mode) error {

	var whereMethod WhereFunc
	var debugMode string

	if mode == requestv1.Where_OR {
		debugMode = "OR"
		whereMethod = q.WhereOr
	} else {
		debugMode = "AND"
		whereMethod = q.Where
	}

	zap.L().Debug(fmt.Sprintf("addWhereClause: %s %s %s %s %s", debugMode, column, path, op, val))

	switch op {

	case requestv1.WhereOperator_LIKE, requestv1.WhereOperator_NLIKE, requestv1.WhereOperator_ILIKE, requestv1.WhereOperator_NILIKE:
		whereMethod(fmt.Sprintf("?%s %s ?", renderJsonAccessor(path), request.OperatorSql(op)), column, fmt.Sprintf("%%%s%%", unpackValue(val[0])))

	case requestv1.WhereOperator_STARTSWITH, requestv1.WhereOperator_NSTARTSWITH, requestv1.WhereOperator_ISTARTSWITH, requestv1.WhereOperator_NISTARTSWITH:
		whereMethod(fmt.Sprintf("?%s %s ?", renderJsonAccessor(path), request.OperatorSql(op)), column, fmt.Sprintf("%s%%", unpackValue(val[0])))

	case requestv1.WhereOperator_ENDSWITH, requestv1.WhereOperator_NENDSWITH, requestv1.WhereOperator_IENDSWITH, requestv1.WhereOperator_NIENDSWITH:
		whereMethod(fmt.Sprintf("?%s %s ?", renderJsonAccessor(path), request.OperatorSql(op)), column, fmt.Sprintf("%%%s", unpackValue(val[0])))

	case requestv1.WhereOperator_ISNULL:
		whereMethod(fmt.Sprintf("?%s %s", renderJsonAccessor(path), request.OperatorSql(op)), column)

	case requestv1.WhereOperator_NOTNULL:
		whereMethod(fmt.Sprintf("?%s %s", renderJsonAccessor(path), request.OperatorSql(op)), column)

	case requestv1.WhereOperator_COL_NIN_VAL, requestv1.WhereOperator_COL_IN_VAL, requestv1.WhereOperator_VAL_IN_COL, requestv1.WhereOperator_VAL_NIN_COL:
		panic("not implemented update the where builder jsonb handler")
		//whereMethod(fmt.Sprintf("?%s %s (?)", renderJsonAccessor(path), OperatorSql(op)), column, bun.In(val))

	case requestv1.WhereOperator_BETWEEN, requestv1.WhereOperator_NBETWEEN:
		if len(val) != 2 {
			return fmt.Errorf("invalid number of values for operator %s: %d", op, len(val))
		}
		whereMethod(fmt.Sprintf("?%s %s ? AND ?", renderJsonAccessor(path), request.OperatorSql(op)), column, val[0], val[1])

	default:
		whereMethod(fmt.Sprintf("?%s %s ?", renderJsonAccessor(path), request.OperatorSql(op)), column, val[0])
	}

	return nil
}

func renderJsonAccessor(path string) string {
	if path == "" {
		// No sub-path specified — cast the whole JSONB value to text so that
		// operators like ILIKE can be applied to it.
		return "::text"
	}
	parts := strings.Split(path, ".")
	if len(parts) == 1 {
		return fmt.Sprintf("->>'%s'", path)
	}
	sb := strings.Builder{}
	for i, part := range parts {
		if i == len(parts)-1 {
			sb.WriteString(fmt.Sprintf("->>'%s'", part))
		} else {
			sb.WriteString(fmt.Sprintf("->'%s'", part))
		}
	}
	return sb.String()
}

func unpackValue(value interface{}) interface{} {
	switch v := value.(type) {
	case *string:
		return v
	default:
		return value
	}
}
