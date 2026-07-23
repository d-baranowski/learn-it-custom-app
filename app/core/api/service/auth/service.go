package auth

import (
	"app/core/gen/core/auth/v1/authv1connect"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"

	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
	"github.com/bufbuild/protovalidate-go"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Service struct {
	repository *repository.Repository[model.User, corev1.User, corev1.SaveUserRequest]
	validator  *protovalidate.Validator
	log        *zap.Logger
}

type ServiceProviderProps struct {
	fx.In

	ApiServer   *api.Server
	DB          *bun.DB
	ModelParser repository.ModelParser
	ViewEngine  *repository.ViewEngine
	Log         *zap.Logger
}

func ServiceProvider(props ServiceProviderProps) error {
	tracer := tracing.NewTracer("api.authService")
	s, err := newService(ServiceProps{
		DB:  props.DB,
		Log: props.Log,
	})
	if err != nil {
		return err
	}
	s.repository = repository.NewRepository[model.User, corev1.User, corev1.SaveUserRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	otelInterceptor, err := otelconnect.NewInterceptor(otelconnect.WithTrustRemote())
	if err != nil {
		return err
	}

	path, h := authv1connect.NewAuthServiceHandler(s, connect.WithInterceptors(otelInterceptor))
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
		log:       props.Log.Named("auth"),
	}

	return s, nil
}
