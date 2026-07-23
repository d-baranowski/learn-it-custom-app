package financial_dashboard

import (
	calendarv1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"fmt"
	"time"

	"connectrpc.com/connect"
	"go.uber.org/zap"
)

const (
	// MonthsBackward defines how many months back from reference to fetch
	MonthsBackward = 8
	// MonthsForward defines how many months forward from reference to fetch
	MonthsForward = 3
	// TotalMonths is the total number of months to fetch (backward + forward + current)
	TotalMonths = MonthsBackward + MonthsForward + 1
)

func (h *Service) GetFinancialOverview(ctx context.Context, req *connect.Request[calendarv1.GetFinancialOverviewRequest]) (*connect.Response[calendarv1.GetFinancialOverviewResponse], error) {
	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	// Parse reference month from MM-YYYY format
	referenceMonth, err := time.Parse("01-2006", req.Msg.ReferenceMonth)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("invalid reference month format: %w", err))
	}

	// Normalize to start of month in UTC
	referenceMonth = time.Date(referenceMonth.Year(), referenceMonth.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Calculate range
	startMonth := referenceMonth.AddDate(0, -MonthsBackward, 0)
	endMonth := referenceMonth.AddDate(0, MonthsForward+1, 0) // +1 because we want end of 3rd month forward

	// Convert to date strings (YYYY-MM-DD) for querying session.date
	startDateStr := startMonth.Format("2006-01-02")
	endDateStr := endMonth.Format("2006-01-02")

	// Unix ms timestamps are still needed for transaction queries (incurred_at is int64)
	startTimeMs := startMonth.UnixMilli()
	endTimeMs := endMonth.UnixMilli()
	nowDateStr := time.Now().Format("2006-01-02")

	h.log.Debug("Fetching financial overview",
		zap.Time("referenceMonth", referenceMonth),
		zap.Time("startMonth", startMonth),
		zap.Time("endMonth", endMonth),
	)

	// Query sessions (paid past sessions and all future non-cancelled sessions)
	// Past sessions must have paid_at set, future sessions are assumed will be paid
	var sessions []struct {
		TherapistId             string
		TherapistName           string
		TherapistColor          *string
		TherapistAbbreviation   *string
		Date                    string
		Price                   float64
		PercentageProfitSharing *float64
	}

	err = h.db.NewSelect().
		TableExpr("core.session as s").
		ColumnExpr("s.therapist_id").
		ColumnExpr("COALESCE(u.display_name, '') as therapist_name").
		ColumnExpr("t.display_color as therapist_color").
		ColumnExpr("u.display_abbreviation as therapist_abbreviation").
		ColumnExpr("s.date").
		ColumnExpr("s.price").
		ColumnExpr("t.percentage_profit_sharing").
		Join("LEFT JOIN core.therapist t ON t.id = s.therapist_id").
		Join("LEFT JOIN core.user u ON u.id = t.user_id").
		Where("s.deleted_at IS NULL").
		Where("s.cancelled_at IS NULL").
		Where("s.date >= ?", startDateStr).
		Where("s.date < ?", endDateStr).
		Where("(s.date < ? AND s.paid_at IS NOT NULL) OR s.date >= ?",
			nowDateStr,
			nowDateStr).
		Scan(ctx, &sessions)

	if err != nil {
		h.log.Error("Failed to query sessions", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to query sessions: %w", err))
	}

	// Query transactions (these still use int64 incurred_at)
	var transactions []struct {
		Id                    string
		RecurringCashflowId   *string
		DisplayName           string
		RecurringCashflowName *string
		Amount                float64
		IncurredAt            int64
	}
	err = h.db.NewSelect().
		TableExpr("core.transaction as t").
		ColumnExpr("t.id").
		ColumnExpr("t.recurring_cashflow_id").
		ColumnExpr("t.display_name").
		ColumnExpr("rc.display_name as recurring_cashflow_name").
		ColumnExpr("t.amount").
		ColumnExpr("t.incurred_at").
		Join("LEFT JOIN core.recurring_cashflow rc ON rc.id = t.recurring_cashflow_id").
		Where("t.deleted_at IS NULL").
		Where("t.incurred_at >= ?", startTimeMs).
		Where("t.incurred_at < ?", endTimeMs).
		Scan(ctx, &transactions)

	if err != nil {
		h.log.Error("Failed to query transactions", zap.Error(err))
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to query transactions: %w", err))
	}

	// Group data by month
	monthsData := make(map[string]*calendarv1.MonthlyFinancialData)

	// Initialize all 12 months
	for i := 0; i < TotalMonths; i++ {
		monthTime := startMonth.AddDate(0, i, 0)
		monthKey := monthTime.Format("2006-01")
		monthIdentifier := monthTime.Format("01-2006") // MM-YYYY format

		monthsData[monthKey] = &calendarv1.MonthlyFinancialData{
			Month:            monthIdentifier,
			MonthLabel:       monthTime.Format("Jan 2006"),
			TotalIncome:      0,
			TherapistIncomes: make([]*calendarv1.TherapistIncome, 0),
			Transactions:     make([]*calendarv1.TransactionSummary, 0),
		}
	}

	// Process sessions — use date string (YYYY-MM-DD) for month bucketing
	therapistIncomesMap := make(map[string]map[string]*calendarv1.TherapistIncome) // monthKey -> therapistId -> income

	for _, session := range sessions {
		// Extract month key from date string: "2006-01-02" -> "2006-01"
		// NormalizeDateString strips any "T00:00:00Z" suffix from PostgreSQL DATE columns
		normalizedDate := model.NormalizeDateString(session.Date)
		if len(normalizedDate) < 7 {
			continue
		}
		monthKey := normalizedDate[:7]

		// Calculate actual therapist income based on percentage profit sharing
		// If PercentageProfitSharing is nil, default to 100% (therapist gets all income)
		percentageShare := 1.0
		if session.PercentageProfitSharing != nil {
			percentageShare = *session.PercentageProfitSharing / 100.0
		}
		therapistIncome := session.Price * percentageShare

		if monthData, exists := monthsData[monthKey]; exists {
			monthData.TotalIncome += therapistIncome

			// Initialize therapist incomes map for this month if needed
			if therapistIncomesMap[monthKey] == nil {
				therapistIncomesMap[monthKey] = make(map[string]*calendarv1.TherapistIncome)
			}

			// Add or update therapist income
			if existingIncome, exists := therapistIncomesMap[monthKey][session.TherapistId]; exists {
				existingIncome.Income += therapistIncome
				existingIncome.SessionCount++
			} else {
				therapistIncomesMap[monthKey][session.TherapistId] = &calendarv1.TherapistIncome{
					TherapistId:           session.TherapistId,
					TherapistName:         session.TherapistName,
					Income:                therapistIncome,
					SessionCount:          1,
					TherapistColor:        session.TherapistColor,
					TherapistAbbreviation: session.TherapistAbbreviation,
				}
			}
		}
	}

	// Convert therapist incomes map to slices
	for monthKey, therapistsMap := range therapistIncomesMap {
		for _, income := range therapistsMap {
			monthsData[monthKey].TherapistIncomes = append(monthsData[monthKey].TherapistIncomes, income)
		}
	}

	// Process transactions — these still use int64 incurred_at
	for _, transaction := range transactions {
		transactionTime := time.UnixMilli(transaction.IncurredAt).UTC()
		monthKey := transactionTime.Format("2006-01")

		if monthData, exists := monthsData[monthKey]; exists {
			monthData.Transactions = append(monthData.Transactions, &calendarv1.TransactionSummary{
				TransactionId:         transaction.Id,
				DisplayName:           transaction.DisplayName,
				Amount:                transaction.Amount,
				IncurredAt:            transaction.IncurredAt,
				RecurringCashflowId:   transaction.RecurringCashflowId,
				RecurringCashflowName: transaction.RecurringCashflowName,
			})

			// Add to total income (can be negative for expenses)
			monthData.TotalIncome += transaction.Amount
		}
	}

	// Convert map to sorted slice
	monthsSlice := make([]*calendarv1.MonthlyFinancialData, 0, TotalMonths)
	currentMonth := startMonth
	for i := 0; i < TotalMonths; i++ {
		monthKey := currentMonth.Format("2006-01")
		monthsSlice = append(monthsSlice, monthsData[monthKey])
		currentMonth = currentMonth.AddDate(0, 1, 0)
	}

	return connect.NewResponse(&calendarv1.GetFinancialOverviewResponse{
		Months: monthsSlice,
	}), nil
}
