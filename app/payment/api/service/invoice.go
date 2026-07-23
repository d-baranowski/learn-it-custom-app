package service

import (
	"app/payment/config"
	paymentv1 "app/payment/gen/payment/v1"
	"app/payment/gen/payment/v1/paymentv1connect"
	"app/payment/model"
	"context"
	"fmt"
	"github.com/bufbuild/protovalidate-go"
	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/invoice"
	"github.com/stripe/stripe-go/v84/invoiceitem"
	"pkg/api"
	"pkg/tracing"
	"pkg/util"

	"connectrpc.com/connect"
	"go.uber.org/zap"
)

type InvoiceService struct {
	api.AutocompleteMethod[model.Invoice]
	api.GetMethod[model.Invoice, paymentv1.Invoice]
	api.ListMethod[model.Invoice, paymentv1.ListInvoiceResponse]
	//api.CreateMethod[model.Invoice, paymentv1.SaveInvoiceRequest, paymentv1.Invoice]
	api.UpdateMethod[model.Invoice, paymentv1.SaveInvoiceRequest, paymentv1.Invoice]
	api.SoftDeleteMethod[model.Invoice]
	api.DeleteMethod[model.Invoice]

	tracer       *tracing.Tracer
	validator    *protovalidate.Validator
	stripeConfig *config.StripeConfig
}

func (cm *InvoiceService) Create(ctx context.Context, req *connect.Request[paymentv1.SaveInvoiceRequest]) (*connect.Response[paymentv1.Invoice], error) {
	_, span, log := cm.tracer.Start(ctx, "createMethod")
	defer span.End()

	stripe.Key = cm.stripeConfig.SecretKey

	customerID := util.Str(req.Msg.Customer)
	currency := util.Str(req.Msg.Currency)
	if currency == "" {
		currency = "pln"
	}

	// Create invoice items from the items array
	if len(req.Msg.Items) > 0 {
		for _, item := range req.Msg.Items {
			itemCurrency := util.Str(item.Currency)
			if itemCurrency == "" {
				itemCurrency = currency
			}

			_, err := invoiceitem.New(&stripe.InvoiceItemParams{
				Customer:    stripe.String(customerID),
				Currency:    stripe.String(itemCurrency),
				Amount:      stripe.Int64(item.Amount),
				Description: stripe.String(item.Description),
				Quantity:    stripe.Int64(int64(item.Quantity)),
			})
			if err != nil {
				log.Error("error creating invoice item", zap.Error(err), zap.String("description", item.Description))
				span.RecordError(err)
				return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create invoice item: %w", err))
			}
		}
	} else if req.Msg.Amount != nil && *req.Msg.Amount > 0 {
		// Fallback to single amount for backwards compatibility
		desc := util.Str(req.Msg.Description)
		if desc == "" {
			desc = "Invoice item"
		}
		_, err := invoiceitem.New(&stripe.InvoiceItemParams{
			Customer:    stripe.String(customerID),
			Currency:    stripe.String(currency),
			Amount:      stripe.Int64(*req.Msg.Amount),
			Description: stripe.String(desc),
		})
		if err != nil {
			log.Error("error creating invoice item", zap.Error(err))
			span.RecordError(err)
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create invoice item: %w", err))
		}
	}

	// Create invoice
	stripeInvoice, err := invoice.New(&stripe.InvoiceParams{
		Customer:    stripe.String(customerID),
		Currency:    stripe.String(currency),
		Description: stripe.String(util.Str(req.Msg.Description)),
	})
	if err != nil {
		log.Error("error creating stripe invoice", zap.Error(err))
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	return connect.NewResponse(cm.stripeInvoiceToProto(stripeInvoice)), nil
}

func (cm *InvoiceService) stripeInvoiceToProto(s *stripe.Invoice) *paymentv1.Invoice {
	resp := &paymentv1.Invoice{
		Id:              s.ID,
		Object:          string(s.Object),
		AmountDue:       s.AmountDue,
		AmountPaid:      s.AmountPaid,
		AmountRemaining: s.AmountRemaining,
		AttemptCount:    int32(s.AttemptCount),
		Attempted:       s.Attempted,
		Currency:        string(s.Currency),
		Created:         s.Created,
		Livemode:        s.Livemode,
		Subtotal:        s.Subtotal,
		Total:           s.Total,
	}

	if s.CollectionMethod != "" {
		resp.CollectionMethod = util.PStr(string(s.CollectionMethod))
	}
	if s.Customer != nil && s.Customer.ID != "" {
		resp.Customer = util.PStr(s.Customer.ID)
	}
	if s.Description != "" {
		resp.Description = util.PStr(s.Description)
	}
	if s.DueDate != 0 {
		resp.DueDate = util.ToPtr(s.DueDate)
	}
	if s.Footer != "" {
		resp.Footer = util.PStr(s.Footer)
	}
	if s.HostedInvoiceURL != "" {
		resp.HostedInvoiceUrl = util.PStr(s.HostedInvoiceURL)
	}
	if s.InvoicePDF != "" {
		resp.InvoicePdf = util.PStr(s.InvoicePDF)
	}
	if s.Number != "" {
		resp.Number = util.PStr(s.Number)
	}
	if s.PeriodEnd != 0 {
		resp.PeriodEnd = util.ToPtr(s.PeriodEnd)
	}
	if s.PeriodStart != 0 {
		resp.PeriodStart = util.ToPtr(s.PeriodStart)
	}
	if s.Status != "" {
		resp.Status = util.PStr(string(s.Status))
	}

	return resp
}

func InvoiceServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.Invoice")

	s := api.NewService[
		InvoiceService,
		model.Invoice,

		paymentv1.Invoice,
		paymentv1.ListInvoiceResponse,
		paymentv1.SaveInvoiceRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.tracer = tracer
	s.validator = api.Validator
	s.stripeConfig = props.StripeConfig

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := paymentv1connect.NewInvoiceServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
