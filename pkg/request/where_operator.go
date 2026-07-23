package request

import (
	requestv1 "pkg/request/gen/request/v1"
)

const (
	EQ           = requestv1.WhereOperator_EQ
	NEQ          = requestv1.WhereOperator_NEQ
	GT           = requestv1.WhereOperator_GT
	GTE          = requestv1.WhereOperator_GTE
	LT           = requestv1.WhereOperator_LT
	LTE          = requestv1.WhereOperator_LTE
	CINV         = requestv1.WhereOperator_COL_IN_VAL
	CNINV        = requestv1.WhereOperator_COL_NIN_VAL
	VINC         = requestv1.WhereOperator_VAL_IN_COL
	VNINC        = requestv1.WhereOperator_VAL_NIN_COL
	LIKE         = requestv1.WhereOperator_LIKE
	NLIKE        = requestv1.WhereOperator_NLIKE
	ILIKE        = requestv1.WhereOperator_ILIKE
	NILIKE       = requestv1.WhereOperator_NILIKE
	BETWEEN      = requestv1.WhereOperator_BETWEEN
	NBETWEEN     = requestv1.WhereOperator_NBETWEEN
	ISNULL       = requestv1.WhereOperator_ISNULL
	NOTNULL      = requestv1.WhereOperator_NOTNULL
	STARTSWITH   = requestv1.WhereOperator_STARTSWITH
	NSTARTSWITH  = requestv1.WhereOperator_NSTARTSWITH
	ENDSWITH     = requestv1.WhereOperator_ENDSWITH
	NENDSWITH    = requestv1.WhereOperator_NENDSWITH
	ISTARTSWITH  = requestv1.WhereOperator_ISTARTSWITH
	NISTARTSWITH = requestv1.WhereOperator_NISTARTSWITH
	IENDSWITH    = requestv1.WhereOperator_IENDSWITH
	NIENDSWITH   = requestv1.WhereOperator_NIENDSWITH
	BITWISEAND   = requestv1.WhereOperator_BITWISEAND
	NBITWISEAND  = requestv1.WhereOperator_NBITWISEAND
	BITWISEOR    = requestv1.WhereOperator_BITWISEOR
	NBITWISEOR   = requestv1.WhereOperator_NBITWISEOR

	DefaultOperator = "="
)

var operatorSqlMap = map[requestv1.WhereOperator]string{
	EQ:  "=",
	NEQ: "<>",
	GT:  ">",
	GTE: ">=",
	LT:  "<",
	LTE: "<=",

	CINV:         "IN",
	CNINV:        "NOT IN",
	VINC:         "IN",
	VNINC:        "NOT IN",
	LIKE:         "LIKE",
	NLIKE:        "NOT LIKE",
	ILIKE:        "ILIKE",
	NILIKE:       "NOT ILIKE",
	BETWEEN:      "BETWEEN",
	NBETWEEN:     "NOT BETWEEN",
	ISNULL:       "IS NULL",
	NOTNULL:      "IS NOT NULL",
	STARTSWITH:   "LIKE",
	NSTARTSWITH:  "NOT LIKE",
	ENDSWITH:     "LIKE",
	NENDSWITH:    "NOT LIKE",
	ISTARTSWITH:  "ILIKE",
	NISTARTSWITH: "NOT ILIKE",
	IENDSWITH:    "ILIKE",
	NIENDSWITH:   "NOT ILIKE",
	BITWISEAND:   "&",
	NBITWISEAND:  "&",
	BITWISEOR:    "|",
	NBITWISEOR:   "|",
}

func OperatorSql(opr requestv1.WhereOperator) string {
	if sql, ok := operatorSqlMap[opr]; ok {
		return sql
	}

	return DefaultOperator
}
