package tracing

import (
	"context"
	"go.opentelemetry.io/contrib/propagators/aws/xray"
	"go.opentelemetry.io/contrib/samplers/probability/consistent"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/base"
	"time"
)

// init guarantees the W3C TraceContext + Baggage propagators are installed
// globally before any package (otelconnect, otelhttp, etc.) constructs
// interceptors that cache otel.GetTextMapPropagator() at init-time. The
// Fx-driven OtelHttpExporterProvider re-asserts the same value later but
// can race with service constructors that wire interceptors during Start.
func init() {
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))
}

func OtelHttpExporterProvider(ctx context.Context, lc fx.Lifecycle,
	name *base.ServiceName, env *base.ServiceEnv, ver *base.ServiceVersion, config *Config) error {
	if !config.Enabled {
		return nil
	}

	res, err := resource.New(ctx,
		resource.WithFromEnv(),
		resource.WithTelemetrySDK(),
		resource.WithHost(),
		resource.WithAttributes(
			attribute.String("service.name", name.String()),
			attribute.String("service.env", env.String()),
			attribute.String("service.version", ver.String()),
		),
	)
	if err != nil {
		return err
	}

	//res, err := resource.Merge(
	//	resource.Default(),
	//	resource.NewWithAttributes(
	//		semconv.SchemaURL,
	//		attribute.String("service.name", name.String()),
	//		attribute.String("service.env", env.String()),
	//		attribute.String("service.version", ver.String()),
	//	),
	//)

	traceExporterOpts := []otlptracehttp.Option{
		otlptracehttp.WithEndpoint(config.Endpoint),
		//otlptracehttp.WithCompression(gzip.Name),
		//otlptracehttp.WithHeaders(map[string]string{
		//	"uptrace-dsn": dsn,
		//}),
	}

	if !config.Https {
		traceExporterOpts = append(traceExporterOpts, otlptracehttp.WithInsecure())
	}

	traceExporter, err := otlptracehttp.New(ctx, traceExporterOpts...)
	if err != nil {
		return err
	}

	sampler := consistent.ParentProbabilityBased(
		consistent.ProbabilityBased(config.SampleRate),
	)

	bsp := sdktrace.NewBatchSpanProcessor(traceExporter,
		sdktrace.WithMaxQueueSize(1000),
		sdktrace.WithMaxExportBatchSize(1000))

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithIDGenerator(xray.NewIDGenerator()),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sampler),
		sdktrace.WithSpanProcessor(bsp),
	)

	otel.SetTracerProvider(tracerProvider)

	prop := propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)
	otel.SetTextMapPropagator(prop)

	metricsExporterOpts := []otlpmetrichttp.Option{
		otlpmetrichttp.WithEndpoint(config.Endpoint),
		//otlpmetrichttp.WithCompression(gzip.Name),
	}

	if !config.Https {
		metricsExporterOpts = append(metricsExporterOpts, otlpmetrichttp.WithInsecure())
	}

	metricsExporter, err := otlpmetrichttp.New(ctx, metricsExporterOpts...)
	if err != nil {
		return err
	}

	reader := sdkmetric.NewPeriodicReader(
		metricsExporter,
		sdkmetric.WithInterval(15*time.Second),
	)

	metricsProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(reader),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(metricsProvider)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return nil
		},
		OnStop: func(ctx context.Context) error {
			if err = metricsProvider.Shutdown(ctx); err != nil {
				zap.L().Error("failed to shutdown metrics provider", zap.Error(err))
			}

			if err = tracerProvider.Shutdown(ctx); err != nil {
				zap.L().Error("failed to shutdown tracer provider", zap.Error(err))
			}

			return nil
		},
	})

	return nil
}

func preferDeltaTemporalitySelector(kind sdkmetric.InstrumentKind) metricdata.Temporality {
	switch kind {
	case sdkmetric.InstrumentKindCounter,
		sdkmetric.InstrumentKindObservableCounter,
		sdkmetric.InstrumentKindHistogram:
		return metricdata.DeltaTemporality
	default:
		return metricdata.CumulativeTemporality
	}
}
