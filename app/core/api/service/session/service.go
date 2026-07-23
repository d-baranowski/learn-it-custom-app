package session

import (
	"app/core/gen/core/session/v1/sessionv1connect"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"

	"github.com/bufbuild/protovalidate-go"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Service struct {
	respository *repository.Repository[model.UserSession, corev1.Session, corev1.SaveSessionRequest]
	validator   *protovalidate.Validator
	log         *zap.Logger
	tracer      *tracing.Tracer
}

type ServiceProviderProps struct {
	fx.In

	ApiServer   *api.Server
	DB          *bun.DB
	Log         *zap.Logger
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
}

func ServiceProvider(props ServiceProviderProps) error {
	tracer := tracing.NewTracer("api.sessionService")
	s, err := newService(ServiceProps{
		DB:  props.DB,
		Log: props.Log,
	})
	if err != nil {
		return err
	}

	s.tracer = tracer
	s.respository = repository.NewRepository[model.UserSession, corev1.Session, corev1.SaveSessionRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := sessionv1connect.NewSessionServiceHandler(s, combined)
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
		validator: validator,
		log:       props.Log.Named("me"),
	}

	return s, nil
}
