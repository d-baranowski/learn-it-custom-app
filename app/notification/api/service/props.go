package service

import (
	"pkg/api"
	"pkg/repository"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type ApiServiceProps struct {
	fx.In

	ApiServer   *api.Server
	DB          *bun.DB
	Log         *zap.Logger
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
	Config      *repository.Config
}
