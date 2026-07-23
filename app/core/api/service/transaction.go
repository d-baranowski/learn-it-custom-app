package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type TransactionService struct {
	api.AutocompleteMethod[model.Transaction]
	api.GetMethod[model.Transaction, corev1.Transaction]
	api.ListMethod[model.Transaction, corev1.ListTransactionResponse]
	api.CreateMethod[model.Transaction, corev1.SaveTransactionRequest, corev1.Transaction]
	api.UpdateMethod[model.Transaction, corev1.SaveTransactionRequest, corev1.Transaction]
	api.SoftDeleteMethod[model.Transaction]
	api.DeleteMethod[model.Transaction]
}

func TransactionServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.transaction")

	s := api.NewService[
		TransactionService,
		model.Transaction,

		corev1.Transaction,
		corev1.ListTransactionResponse,
		corev1.SaveTransactionRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTransactionServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
