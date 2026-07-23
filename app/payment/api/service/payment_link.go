package service

import (
	paymentv1 "app/payment/gen/payment/v1"
	"app/payment/gen/payment/v1/paymentv1connect"
	"app/payment/model"
	"context"
	"database/sql"
	"fmt"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/decimal"
	"pkg/repository"
	"pkg/tracing"
	"pkg/unix"

	"connectrpc.com/connect"
	"github.com/segmentio/ksuid"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type PaymentLinkService struct {
	api.GetMethod[model.PaymentLink, paymentv1.PaymentLink]
	api.ListMethod[model.PaymentLink, paymentv1.ListPaymentLinkResponse]

	repository *repository.Repository[model.PaymentLink, paymentv1.PaymentLink, paymentv1.UpsertSessionPaymentLinkRequest]
	tracer     *tracing.Tracer
}

func PaymentLinkServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.payment_link")

	s := api.NewService[
		PaymentLinkService,
		model.PaymentLink,
		paymentv1.PaymentLink,
		paymentv1.ListPaymentLinkResponse,
		paymentv1.UpsertSessionPaymentLinkRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.PaymentLink, paymentv1.PaymentLink, paymentv1.UpsertSessionPaymentLinkRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)
	s.tracer = tracer

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := paymentv1connect.NewPaymentServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *PaymentLinkService) UpsertSessionPaymentLink(ctx context.Context, req *connect.Request[paymentv1.UpsertSessionPaymentLinkRequest]) (*connect.Response[paymentv1.PaymentLink], error) {
	_, span, log := s.tracer.Start(ctx, "UpsertSessionPaymentLink")
	defer span.End()

	amountDecimal, err := decimal.NewFromString(req.Msg.Amount)
	if err != nil {
		err := fmt.Errorf("invalid amount")
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if amountDecimal.IsZero() {
		err := fmt.Errorf("amount must be positive")
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		err := fmt.Errorf("no userID provided")
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeUnauthenticated, err)
	}

	var row model.PaymentLink
	err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		selectQuery := tx.NewSelect().
			Model(&row).
			Limit(1)

		if req.Msg.PaymentLinkId != nil && *req.Msg.PaymentLinkId != "" {
			err := selectQuery.Where("id = ?", *req.Msg.PaymentLinkId).Scan(ctx)
			if err == nil {
				return upsertPaymentLinkRow(&row, req.Msg, userID, tx, ctx)
			}
			if err != nil && err != sql.ErrNoRows {
				return err
			}
		}

		now := unix.Now()
		row = model.PaymentLink{
			Id:            ksuid.New().String(),
			Provider:      model.PaymentLinkProviderStripe,
			Status:        model.PaymentLinkStatusPending,
			Amount:        amountDecimal,
			Currency:      req.Msg.Currency,
			Description:   req.Msg.Description,
			AttemptCount:  0,
			NextAttemptAt: &now,
			CreatedAt:     now,
			CreatedBy:     userID,
		}

		return tx.NewInsert().Model(&row).Returning("*").Scan(ctx)
	})
	if err != nil {
		log.Error("failed to upsert payment link", zap.Error(err))
		return nil, api.CommonApiErrorHandler(err)
	}

	return connect.NewResponse(paymentLinkToProto(&row)), nil
}

func upsertPaymentLinkRow(row *model.PaymentLink, req *paymentv1.UpsertSessionPaymentLinkRequest, userID string, tx bun.Tx, ctx context.Context) error {
	if row.Status == model.PaymentLinkStatusReady && row.Url != nil && *row.Url != "" {
		return nil
	}

	amountDecimal, err := decimal.NewFromString(req.Amount)
	now := unix.Now()
	row.Provider = model.PaymentLinkProviderStripe
	row.Status = model.PaymentLinkStatusPending
	row.Url = nil
	row.ErrorMessage = nil
	row.Amount = amountDecimal
	row.Currency = req.Currency
	row.Description = req.Description
	row.AttemptCount = 0
	row.LastAttemptAt = nil
	row.NextAttemptAt = &now
	row.UpdatedAt = &now
	row.UpdatedBy = &userID

	_, err = tx.NewUpdate().
		Model(row).
		Column(
			"provider",
			"status",
			"url",
			"error_message",
			"amount",
			"currency",
			"description",
			"attempt_count",
			"last_attempt_at",
			"next_attempt_at",
			"updated_at",
			"updated_by",
		).
		WherePK().
		Exec(ctx)
	return err
}

func paymentLinkToProto(row *model.PaymentLink) *paymentv1.PaymentLink {
	result := &paymentv1.PaymentLink{
		Id:           row.Id,
		Provider:     row.Provider,
		Status:       row.Status,
		Amount:       row.Amount.String(),
		Currency:     row.Currency,
		Description:  row.Description,
		AttemptCount: int32(row.AttemptCount),
		CreatedAt:    row.CreatedAt.Int64(),
		CreatedBy:    row.CreatedBy,
	}

	if row.Url != nil {
		result.Url = row.Url
	}
	if row.ErrorMessage != nil {
		result.ErrorMessage = row.ErrorMessage
	}
	if row.ProviderReference != nil {
		result.ProviderReference = row.ProviderReference
	}
	if row.NextAttemptAt != nil {
		result.NextAttemptAt = row.NextAttemptAt.Int64Ptr()
	}
	if row.LastAttemptAt != nil {
		result.LastAttemptAt = row.LastAttemptAt.Int64Ptr()
	}
	if row.UpdatedAt != nil {
		result.UpdatedAt = row.UpdatedAt.Int64Ptr()
	}
	if row.UpdatedBy != nil {
		result.UpdatedBy = row.UpdatedBy
	}

	return result
}
