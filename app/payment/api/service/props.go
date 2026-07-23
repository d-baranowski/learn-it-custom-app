package service

import (
	"app/payment/config"
	"pkg/api"
	"pkg/pgmq"
	"pkg/repository"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type ApiServiceProps struct {
	fx.In

	ApiServer      *api.Server
	DB             *bun.DB
	Log            *zap.Logger
	ModelParser    repository.ModelParser
	ViewEngine     *repository.ViewEngine
	Config         *repository.Config
	StripeConfig   *config.StripeConfig
	EventPublisher pgmq.Publisher `optional:"true"`
}
