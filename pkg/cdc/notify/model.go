package notify

type Subject struct {
	Schema string `json:"schema"`
	Table  string `json:"table"`
}

type When struct {
	InsertClause string
	UpdateClause string
	DeleteClause string
}
