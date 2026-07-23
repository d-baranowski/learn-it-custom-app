package postgres

import (
	"context"
	"database/sql"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
	"go.uber.org/fx"
)

func RegisterPoolMetrics(lc fx.Lifecycle, db *sql.DB) error {
	meter := otel.GetMeterProvider().Meter("utro/db")

	open, err := meter.Int64ObservableGauge("db.pool.connections.open",
		metric.WithDescription("Open connections (in use + idle)"))
	if err != nil {
		return err
	}
	inUse, err := meter.Int64ObservableGauge("db.pool.connections.in_use",
		metric.WithDescription("Connections currently in use"))
	if err != nil {
		return err
	}
	idle, err := meter.Int64ObservableGauge("db.pool.connections.idle",
		metric.WithDescription("Idle connections in the pool"))
	if err != nil {
		return err
	}
	waitCount, err := meter.Int64ObservableCounter("db.pool.acquire.wait_count",
		metric.WithDescription("Total connections that had to wait for an idle slot"))
	if err != nil {
		return err
	}
	waitSeconds, err := meter.Float64ObservableCounter("db.pool.acquire.wait_seconds",
		metric.WithDescription("Total time blocked waiting for a connection"),
		metric.WithUnit("s"))
	if err != nil {
		return err
	}

	reg, err := meter.RegisterCallback(
		func(_ context.Context, o metric.Observer) error {
			s := db.Stats()
			o.ObserveInt64(open, int64(s.OpenConnections))
			o.ObserveInt64(inUse, int64(s.InUse))
			o.ObserveInt64(idle, int64(s.Idle))
			o.ObserveInt64(waitCount, s.WaitCount)
			o.ObserveFloat64(waitSeconds, s.WaitDuration.Seconds())
			return nil
		},
		open, inUse, idle, waitCount, waitSeconds,
	)
	if err != nil {
		return err
	}

	lc.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return reg.Unregister()
		},
	})

	return nil
}
