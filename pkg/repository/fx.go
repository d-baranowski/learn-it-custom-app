package repository

import "go.uber.org/fx"

var Module = fx.Module("repository",
	fx.Provide(ViewEngineProvider),
	fx.Provide(ModelParserProvider),
	fx.Provide(AutoLabelerProvider),
	fx.Invoke(AutocompleteProvider),
)
