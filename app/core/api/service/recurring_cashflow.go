package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"fmt"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"
	"pkg/unix"
	"time"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type RecurringCashflowService struct {
	repository *repository.Repository[model.RecurringCashflow, corev1.RecurringCashflow, corev1.SaveRecurringCashflowRequest]

	api.AutocompleteMethod[model.RecurringCashflow]
	api.GetMethod[model.RecurringCashflow, corev1.RecurringCashflow]
	api.ListMethod[model.RecurringCashflow, corev1.ListRecurringCashflowResponse]
	api.CreateMethod[model.RecurringCashflow, corev1.SaveRecurringCashflowRequest, corev1.RecurringCashflow]
	api.UpdateMethod[model.RecurringCashflow, corev1.SaveRecurringCashflowRequest, corev1.RecurringCashflow]
	api.SoftDeleteMethod[model.RecurringCashflow]
	api.DeleteMethod[model.RecurringCashflow]
}

func RecurringCashflowServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.recurring_cashflow")

	s := api.NewService[
		RecurringCashflowService,
		model.RecurringCashflow,

		corev1.RecurringCashflow,
		corev1.ListRecurringCashflowResponse,
		corev1.SaveRecurringCashflowRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.RecurringCashflow, corev1.RecurringCashflow, corev1.SaveRecurringCashflowRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	// Post-hook to generate transactions immediately after recurring cashflow creation.
	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, recurringCashflow *model.RecurringCashflow, extra *repository.ExtraInfoReqResp[corev1.SaveRecurringCashflowRequest, corev1.RecurringCashflow]) error {
		return generateTransactionsForRecurringCashflow(ctx, tx, recurringCashflow, props.Config.Timezone, props.Log)
	})

	// Post-hook to handle transaction cleanup and regeneration after recurring cashflow update
	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.RecurringCashflow, extra *repository.ExtraInfoReqResp[corev1.SaveRecurringCashflowRequest, corev1.RecurringCashflow]) error {
		// Only process if there's a frequency defined
		if len(result.Frequency) == 0 {
			props.Log.Info("skipping transaction management, no frequency defined",
				zap.String("recurringCashflowId", result.Id))
			return nil
		}

		props.Log.Info("managing transactions after recurring cashflow update",
			zap.String("recurringCashflowId", result.Id),
			zap.Int("frequencyCount", len(result.Frequency)))

		// Delete ALL future auto-generated transactions to avoid duplicates
		// This ensures a clean slate before regeneration
		now := unix.Now()
		deleteQuery := tx.NewDelete().
			Model((*model.Transaction)(nil)).
			Where("recurring_cashflow_id = ?", result.Id).
			Where("recurring_cashflow_frequency_ref IS NOT NULL").
			Where("incurred_at >= ?", now.Int64())

		deleteResult, err := deleteQuery.Exec(ctx)
		if err != nil {
			props.Log.Error("failed to delete future transactions before regeneration", zap.Error(err))
			return err
		}

		rowsDeleted, _ := deleteResult.RowsAffected()
		props.Log.Info("deleted future auto-generated transactions before regeneration",
			zap.String("recurringCashflowId", result.Id),
			zap.Int64("rowsDeleted", rowsDeleted))

		// Regenerate transactions based on current recurring cashflow configuration
		return generateTransactionsForRecurringCashflow(ctx, tx, result, props.Config.Timezone, props.Log)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewRecurringCashflowServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

// generateTransactionsForRecurringCashflow expands a recurring cashflow's frequency into concrete transactions
// for the recurring cashflow window (start→end or start→start+1y when no end).
func generateTransactionsForRecurringCashflow(ctx context.Context, tx bun.Tx, recurringCashflow *model.RecurringCashflow, timezoneStr string, log *zap.Logger) error {
	if len(recurringCashflow.Frequency) == 0 {
		return nil
	}

	location, err := time.LoadLocation(timezoneStr)
	if err != nil {
		return fmt.Errorf("load timezone %q: %w", timezoneStr, err)
	}

	startUtc := recurringCashflow.StartDate.Time().UTC()
	start := time.Date(startUtc.Year(), startUtc.Month(), startUtc.Day(), 0, 0, 0, 0, location)
	end := start.AddDate(1, 0, 0) // default 1 year when no end date
	if recurringCashflow.EndDate != nil && recurringCashflow.EndDate.Int64() != 0 {
		endUtc := recurringCashflow.EndDate.Time().UTC()
		end = time.Date(endUtc.Year(), endUtc.Month(), endUtc.Day(), 0, 0, 0, 0, location)
	}

	now := unix.Now()

	// Convert RecurringCashflowFrequencyItem to FrequencyItem interface
	frequencies := make([]FrequencyItem, len(recurringCashflow.Frequency))
	for i := range recurringCashflow.Frequency {
		frequencies[i] = &recurringCashflow.Frequency[i]
	}

	// Create a frequency generator with a transaction builder
	generator := NewFrequencyGenerator(
		start,
		end,
		location,
		frequencies,
		recurringCashflow.Id,
		recurringCashflow.CreatedBy,
		now,
		func(occurStart time.Time, startTimeMs int64, ref string, fi int) (*model.Transaction, error) {
			incurredAtTs := unix.GoTimeToTimestamp(occurStart)

			return &model.Transaction{
				RecurringCashflowId:           &recurringCashflow.Id,
				DisplayName:                   recurringCashflow.DisplayName,
				Amount:                        recurringCashflow.Amount,
				IncurredAt:                    incurredAtTs,
				RecurringCashflowFrequencyRef: &ref,
				CreatedAt:                     now,
				CreatedBy:                     recurringCashflow.CreatedBy,
			}, nil
		},
	)

	// Generate transactions
	transactions, err := generator.Generate()
	if err != nil {
		return err
	}

	if len(transactions) == 0 {
		return nil
	}

	// Insert transactions in bulk.
	if _, err := tx.NewInsert().Model(&transactions).Exec(ctx); err != nil {
		return err
	}

	return nil
}
