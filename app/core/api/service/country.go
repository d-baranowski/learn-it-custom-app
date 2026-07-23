package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"log"
	"pkg/api"
	"pkg/repository"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
)

type CountryService struct {
	api.AutocompleteMethod[model.Country]
	api.GetMethod[model.Country, corev1.Country]
	api.ListMethod[model.Country, corev1.ListCountryResponse]
	api.CreateMethod[model.Country, corev1.SaveCountryRequest, corev1.Country]
	api.UpdateMethod[model.Country, corev1.SaveCountryRequest, corev1.Country]
	api.SoftDeleteMethod[model.Country]
	api.DeleteMethod[model.Country]
	repository *repository.Repository[model.Country, corev1.Country, corev1.SaveCountryRequest]
}

func (c CountryService) NationalityAutocomplete(ctx context.Context, _ *connect.Request[requestv1.AutocompleteRequest]) (*connect.Response[requestv1.AutocompleteResponse], error) {
	var items []*requestv1.AutocompleteItem
	err := c.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Table("core.country").
			ColumnExpr("id, nationality_name AS label").
			Scan(ctx, &items)
	})

	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	resp := &requestv1.AutocompleteResponse{
		Items: items,
	}
	return connect.NewResponse(resp), nil
}

func CountryServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.country")

	s := api.NewService[
		CountryService,
		model.Country,

		corev1.Country,
		corev1.ListCountryResponse,
		corev1.SaveCountryRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.Country, corev1.Country, corev1.SaveCountryRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewCountryServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
