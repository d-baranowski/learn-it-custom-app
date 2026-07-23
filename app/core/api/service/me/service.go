package me

import (
	"app/core/gen/core/me/v1/mev1connect"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"pkg/api"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"

	"github.com/bufbuild/protovalidate-go"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Service struct {
	repository  *repository.Repository[model.User, corev1.User, corev1.SaveUserRequest]
	permissions store.PermissionStore
	validator   *protovalidate.Validator
	log         *zap.Logger
}

type ServiceProviderProps struct {
	fx.In

	ApiServer       *api.Server
	DB              *bun.DB
	PermissionStore store.PermissionStore
	ModelParser     repository.ModelParser
	ViewEngine      *repository.ViewEngine
}

func ServiceProvider(props ServiceProviderProps) error {
	tracer := tracing.NewTracer("api.me")
	validator, err := protovalidate.New()
	if err != nil {
		return err
	}

	s := &Service{
		permissions: props.PermissionStore,
		validator:   validator,
		log:         zap.L().Named("api.me"),
		repository:  repository.NewRepository[model.User, corev1.User, corev1.SaveUserRequest](props.DB, tracer, props.ModelParser, props.ViewEngine),
	}

	combind, err := api.CombinedInterceptors()

	path, h := mev1connect.NewMeServiceHandler(s, combind)
	props.ApiServer.AddHandler(path, h)

	return nil
}
