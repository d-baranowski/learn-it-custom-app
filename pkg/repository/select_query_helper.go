package repository

import requestv1 "pkg/request/gen/request/v1"

func FindClausesForField(req *requestv1.SelectRequest, field string) []*requestv1.Where_Clause {
	var clauses []*requestv1.Where_Clause
	if req == nil || req.Where == nil {
		return clauses
	}

	// Helper function to recursively search for clauses
	var findClauses func(*requestv1.Where_Condition)
	findClauses = func(cond *requestv1.Where_Condition) {
		if cond == nil {
			return
		}

		switch c := cond.GetCondition().(type) {
		case *requestv1.Where_Condition_Clause:
			if c.Clause != nil && c.Clause.Field == field {
				clauses = append(clauses, c.Clause)
			}
		case *requestv1.Where_Condition_Group:
			for _, condition := range c.Group.Conditions {
				findClauses(condition)
			}
		case *requestv1.Where_Condition_SubQuery:
			findClauses(c.SubQuery.SubQuery.Conditions[0])
		}
	}

	// Start the search from the top-level conditions
	for _, condition := range req.Where.Conditions {
		findClauses(condition)
	}

	return clauses
}
