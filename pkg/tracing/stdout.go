package tracing

import (
	"context"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/stdout/stdoutmetric"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/base"
	"time"
)

func OTelStdoutExporterProvider(ctx context.Context, lc fx.Lifecycle, name *base.ServiceName, ver *base.ServiceVersion, config *Config) error {
	if !config.Enabled {
		return nil
	}

	res, err := resource.New(ctx,
		resource.WithFromEnv(),
		resource.WithTelemetrySDK(),
		resource.WithHost(),
		resource.WithAttributes(
			attribute.String("service.name", name.String()),
			attribute.String("service.version", ver.String()),
		),
	)
	if err != nil {
		return err
	}

	prop := propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)
	otel.SetTextMapPropagator(prop)

	exp, err := stdouttrace.New(
		stdouttrace.WithPrettyPrint())
	if err != nil {
		return err
	}

	bsp := sdktrace.NewBatchSpanProcessor(exp)
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)

	otel.SetTracerProvider(tracerProvider)

	metricExporter, err := stdoutmetric.New()
	if err != nil {
		return err
	}

	meterProvider := metric.NewMeterProvider(
		metric.WithReader(metric.NewPeriodicReader(metricExporter, metric.WithInterval(3*time.Second))),
	)

	otel.SetMeterProvider(meterProvider)

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			if err = meterProvider.Shutdown(ctx); err != nil {
				zap.L().Error("failed to shutdown meter provider", zap.Error(err))
			}
			if err = tracerProvider.Shutdown(ctx); err != nil {
				zap.L().Error("failed to shutdown tracer provider", zap.Error(err))
			}

			return nil
		},
	})

	return nil
}
