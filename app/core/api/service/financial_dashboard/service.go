package financial_dashboard

import (
	"app/core/gen/core/v1/corev1connect"
	"pkg/api"
	"pkg/tracing"

	"github.com/bufbuild/protovalidate-go"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Service struct {
	db        *bun.DB
	validator *protovalidate.Validator
	log       *zap.Logger
}

type ServiceProviderProps struct {
	fx.In

	ApiServer *api.Server
	DB        *bun.DB
	Log       *zap.Logger
}

func ServiceProvider(props ServiceProviderProps) error {
	_ = tracing.NewTracer("api.financialDashboardService")
	s, err := newService(ServiceProps{
		DB:  props.DB,
		Log: props.Log,
	})
	if err != nil {
		return err
	}

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewFinancialDashboardServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

type ServiceProps struct {
	DB  *bun.DB
	Log *zap.Logger
}

func newService(props ServiceProps) (*Service, error) {
	validator, err := protovalidate.New()
	if err != nil {
		return nil, err
	}

	s := &Service{
		db:        props.DB,
		validator: validator,
		log:       props.Log.Named("financial_dashboard"),
	}

	return s, nil
}
