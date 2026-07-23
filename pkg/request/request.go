package request

type ListResponse[T any] struct {
	Items      []*T                `json:"items"`
	Pagination *PaginationResponse `json:"pagination"`
}

func NewListResponse[T any]() *ListResponse[T] {
	return &ListResponse[T]{
		Items:      make([]*T, 0),
		Pagination: &PaginationResponse{},
	}
}

type AutocompleteItem[T string | int32 | interface{}] struct {
	ID       T      `json:"ID"`
	Label    string `json:"label"`
	Disabled bool   `json:"disabled"`
}

type AutocompleteResponse[T any] struct {
	Items []*T `json:"items"`
}

func NewAutocompleteResponse[T any]() *AutocompleteResponse[T] {
	return &AutocompleteResponse[T]{
		Items: make([]*T, 0),
	}
}

type PaginationResponse struct {
	Page  int32 `json:"page"`
	Total int32 `json:"total"`
}
