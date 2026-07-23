package service

import (
	"net/http"
	"time"

	"pkg/api"
	"pkg/repository"

	paymentv1connect "app/payment/gen/payment/v1/paymentv1connect"
	"connectrpc.com/connect"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type ApiServiceProps struct {
	fx.In

	ApiServer                     *api.Server
	DB                            *bun.DB
	Log                           *zap.Logger
	ModelParser                   repository.ModelParser
	ViewEngine                    *repository.ViewEngine
	Config                        *repository.Config
	PaymentServiceURL             string
	PaymentServiceClientTimeoutMs int
}

// PaymentServiceClientProvider creates the PaymentService client with proper interceptors
func PaymentServiceClientProvider(props ApiServiceProps) paymentv1connect.PaymentServiceClient {
	bi := api.NewBaseInterceptor(api.WithBaseInterceptorSID(true))
	interceptors := connect.WithInterceptors(bi.Interceptor())
	httpClient := &http.Client{
		Timeout: time.Duration(props.PaymentServiceClientTimeoutMs) * time.Millisecond,
	}
	return paymentv1connect.NewPaymentServiceClient(httpClient, props.PaymentServiceURL, interceptors)
}
