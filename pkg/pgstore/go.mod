module pkg/pgstore

go 1.24.0

require (
	github.com/jackc/pgx/v5 v5.8.0
	github.com/json-iterator/go v1.1.12
	go.opentelemetry.io/otel v1.37.0
	go.opentelemetry.io/otel/trace v1.37.0
	go.uber.org/fx v1.23.0
	go.uber.org/zap v1.27.0
	google.golang.org/protobuf v1.36.10
	pkg/health v0.0.0
)

require (
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	go.opentelemetry.io/auto/sdk v1.1.0 // indirect
	go.opentelemetry.io/otel/metric v1.37.0 // indirect
	go.uber.org/dig v1.18.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	golang.org/x/sync v0.17.0 // indirect
	golang.org/x/sys v0.41.0 // indirect
	golang.org/x/text v0.29.0 // indirect
)

replace (
	pkg/health => ../health
	pkg/tracing => ../tracing
)
