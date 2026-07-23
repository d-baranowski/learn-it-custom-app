package repository

import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
)

var (
	NoopDB = bun.NewDB(nil, pgdialect.New())
)
