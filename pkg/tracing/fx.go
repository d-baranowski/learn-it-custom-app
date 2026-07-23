package tracing

import (
	"context"
	"go.uber.org/fx"
	"pkg/base"
)

func Provider(ctx context.Context, lc fx.Lifecycle,
	name *base.ServiceName, env *base.ServiceEnv, ver *base.ServiceVersion, config *Config) error {
	if !config.Enabled {
		return nil
	}

	if config.StdOut {
		return OTelStdoutExporterProvider(ctx, lc, name, ver, config)
	}

	return OtelHttpExporterProvider(ctx, lc, name, env, ver, config)
}

var Module = fx.Module("otel",
	fx.Invoke(Provider),
	fx.Invoke(SpanLoggerProvider),
)
