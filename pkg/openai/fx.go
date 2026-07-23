package openai

import (
	"go.uber.org/fx"
)

// Module provided to fx
var Module = fx.Module("openai",
	fx.Invoke(ClientProvider),
)
