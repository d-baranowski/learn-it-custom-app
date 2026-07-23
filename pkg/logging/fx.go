package logging

import (
	"go.uber.org/fx"
)

// Module provided to fx
var Module = fx.Module("logging",
	fx.Provide(ZapProvider),
)
