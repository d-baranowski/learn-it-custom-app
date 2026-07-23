package health

import (
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/base"
)

type ProviderParams struct {
	fx.In

	Lc      fx.Lifecycle
	Config  *Config
	Log     *zap.Logger
	Name    *base.ServiceName    `optional:"true"`
	Version *base.ServiceVersion `optional:"true"`
}

func Provider(params ProviderParams) (*Server, error) {
	var name, version string
	if params.Name != nil {
		name = string(*params.Name)
	}
	if params.Version != nil {
		version = string(*params.Version)
	}
	return NewHealthServer(params.Lc, params.Config, params.Log, name, version)
}

var Module = fx.Module("health",
	fx.Provide(Provider),
)
