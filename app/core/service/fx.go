package service

import "go.uber.org/fx"

var Module = fx.Module("service",
	fx.Provide(PermissionServiceProvider),
	fx.Provide(CommonServiceProvider),
	fx.Provide(PgmqConsumerProvider),
	fx.Provide(EventHandlerRegistryProvider),
	fx.Invoke(EventConsumerWorkerProvider),
)
