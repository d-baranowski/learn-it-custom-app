package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	paymentv1 "app/payment/gen/payment/v1"
	paymentv1connect "app/payment/gen/payment/v1/paymentv1connect"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"pkg/api"
	"pkg/decimal"
	"pkg/repository"
	v1 "pkg/request/gen/request/v1"
	"pkg/tracing"
	"pkg/unix"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type SessionService struct {
	api.AutocompleteMethod[model.Session]
	api.GetMethod[model.Session, corev1.Session]
	api.ListMethod[model.Session, corev1.ListSessionResponse]
	api.CreateMethod[model.Session, corev1.SaveSessionRequest, corev1.Session]
	api.UpdateMethod[model.Session, corev1.SaveSessionRequest, corev1.Session]
	api.SoftDeleteMethod[model.Session]
	api.DeleteMethod[model.Session]
	repository    *repository.Repository[model.Session, corev1.Session, corev1.SaveSessionRequest]
	db            *bun.DB
	log           *zap.Logger
	paymentClient paymentv1connect.PaymentServiceClient
}

func SessionServiceProvider(props ApiServiceProps, paymentClient paymentv1connect.PaymentServiceClient) error {
	tracer := tracing.NewTracer("api.session")

	s := api.NewService[
		SessionService,
		model.Session,

		corev1.Session,
		corev1.ListSessionResponse,
		corev1.SaveSessionRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.Session, corev1.Session, corev1.SaveSessionRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)
	s.db = props.DB
	s.log = props.Log
	s.paymentClient = paymentClient

	s.CreateMethod.AddPreHook(validateRoomForOfflineSession)
	s.UpdateMethod.AddPreHook(validateRoomForOfflineSession)
	s.UpdateMethod.AddPreHook(clearTherapySessionFrequencyRef)
	s.CreateMethod.AddPreHook(stampCancelledByOnCreate)
	s.UpdateMethod.AddPreHook(stampCancelledByOnTransition)

	s.GetMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, id string, result *model.Session, extra *repository.ExtraInfoReqResp[v1.GetRequest, corev1.Session]) error {
		queryResult := make([]*model.SessionCustomer, 0)

		// Uses the OUTER transaction. It used to call s.repository.Run here,
		// which opens a second transaction from the same pool while this hook
		// still holds the first — with MaxOpenConns=25 that deadlocked the pool
		// at 25 concurrent Gets and hung every login for two hours on
		// 2026-07-29. See infrastructure/INCIDENT-2026-07-29-db-pool-deadlock.md.
		err := tx.NewSelect().
			Model((*model.SessionCustomer)(nil)).
			Column("customer_id").
			Limit(100).
			Where("session_id = ?", result.Id).
			Scan(ctx, &queryResult)

		if err != nil {
			props.Log.Error("error fetching session customers", zap.Error(err))
			return err
		}

		customerIds := make([]string, len(queryResult))
		for i, sc := range queryResult {
			customerIds[i] = sc.CustomerId
		}

		extra.Response.CustomerIds = customerIds

		// KNOWN ISSUE — blocking cross-service HTTP inside an open transaction.
		//
		// This holds a pooled database connection for the whole payment call, so
		// a slow or hanging payment service turns directly into database
		// exhaustion. It no longer DEADLOCKS (that was the nested acquire fixed
		// above — each request now holds exactly one connection, so the pool
		// drains as calls complete), but it still couples database capacity to
		// an external dependency's latency.
		//
		// Properly fixing it needs a post-COMMIT hook: the enrichment has to run
		// after the transaction closes, which pkg/api has no mechanism for today.
		// Until then the blast radius is bounded by Aurora's
		// idle_in_transaction_session_timeout (60s, added in the same incident
		// response) rather than by anything in this code.
		if result.PaymentLinkId != nil && *result.PaymentLinkId != "" {
			paymentResp, err := s.paymentClient.Get(ctx, withPaymentHeaders(
				ctx,
				connect.NewRequest(&v1.GetRequest{ID: *result.PaymentLinkId}),
				result.Id,
				result.CreatedBy,
			))
			if err != nil {
				props.Log.Error("error fetching payment link", zap.Error(err))
				return err
			}

			extra.Response.PaymentLinkId = result.PaymentLinkId
			extra.Response.PaymentLink = paymentResp.Msg.Url
			extra.Response.PaymentStatus = &paymentResp.Msg.Status
		}

		return nil
	})

	// Post-hook to handle customer relationships for Create
	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Session, extra *repository.ExtraInfoReqResp[corev1.SaveSessionRequest, corev1.Session]) error {
		return handleSessionCustomers(ctx, tx, result, extra.Request.CustomerIds)
	})

	// Post-hook to handle customer relationships for Update
	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Session, extra *repository.ExtraInfoReqResp[corev1.SaveSessionRequest, corev1.Session]) error {
		return handleSessionCustomers(ctx, tx, result, extra.Request.CustomerIds)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewSessionServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func validateRoomForOfflineSession(ctx context.Context, tx bun.Tx, session *model.Session, extra *repository.ExtraInfoReq[corev1.SaveSessionRequest]) error {
	if session.IsOnline != nil && !*session.IsOnline {
		if session.RoomId == nil || *session.RoomId == "" {
			return fmt.Errorf("room is required for offline sessions")
		}
	}
	return nil
}

func clearTherapySessionFrequencyRef(ctx context.Context, tx bun.Tx, session *model.Session, extra *repository.ExtraInfoReq[corev1.SaveSessionRequest]) error {
	session.TherapySessionFrequencyRef = nil
	return nil
}

// stampCancelledByOnCreate stamps cancelled_by_user_id when a session is
// created already cancelled. Server is the source of truth — client never
// sends this field.
func stampCancelledByOnCreate(ctx context.Context, tx bun.Tx, session *model.Session, extra *repository.ExtraInfoReq[corev1.SaveSessionRequest]) error {
	if session.CancelledAt == nil {
		session.CancelledByUserId = nil
		return nil
	}
	if extra.UserId != nil && *extra.UserId != "" {
		uid := *extra.UserId
		session.CancelledByUserId = &uid
	}
	return nil
}

// stampCancelledByOnTransition keeps cancelled_by_user_id in sync with the
// cancelled_at transition: stamped from request context on a fresh cancel,
// cleared on undo, preserved when neither cancelled_at nor the undo flag changes
// (so editing other fields doesn't rewrite history).
func stampCancelledByOnTransition(ctx context.Context, tx bun.Tx, session *model.Session, extra *repository.ExtraInfoReq[corev1.SaveSessionRequest]) error {
	var existing model.Session
	err := tx.NewSelect().
		Model(&existing).
		Column("cancelled_at", "cancelled_by_user_id").
		Where("id = ?", session.Id).
		Limit(1).
		Scan(ctx)
	if err != nil {
		return err
	}

	incomingCancelled := session.CancelledAt != nil
	existingCancelled := existing.CancelledAt != nil

	switch {
	case incomingCancelled && !existingCancelled:
		if extra.UserId != nil && *extra.UserId != "" {
			uid := *extra.UserId
			session.CancelledByUserId = &uid
		}
	case !incomingCancelled && existingCancelled:
		session.CancelledByUserId = nil
	default:
		session.CancelledByUserId = existing.CancelledByUserId
	}
	return nil
}

// handleSessionCustomers manages the many-to-many relationship between sessions and customers
func handleSessionCustomers(ctx context.Context, db bun.IDB, session *model.Session, customerIds []string) error {
	// Delete existing relationships
	_, err := db.NewDelete().
		Model((*model.SessionCustomer)(nil)).
		Where("session_id = ?", session.Id).
		Exec(ctx)
	if err != nil {
		return err
	}

	// Create new relationships
	if len(customerIds) > 0 {
		sessionCustomers := make([]*model.SessionCustomer, len(customerIds))
		for i, customerId := range customerIds {
			sessionCustomers[i] = &model.SessionCustomer{
				SessionId:  session.Id,
				CustomerId: customerId,
				CreatedAt:  unix.Now(),
				CreatedBy:  session.CreatedBy,
			}
		}

		_, err = db.NewInsert().
			Model(&sessionCustomers).
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *SessionService) GetNextSession(ctx context.Context, _ *connect.Request[corev1.GetNextSessionRequest]) (*connect.Response[corev1.GetNextSessionResponse], error) {
	row := struct {
		Id string `bun:"id"`
	}{}

	err := s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			TableExpr("core.session AS s").
			ColumnExpr("s.id").
			Where("s.deleted_at IS NULL").
			Where("s.cancelled_at IS NULL").
			Where("((s.date || ' ' || s.start_time)::timestamp AT TIME ZONE COALESCE(NULLIF(s.timezone, ''), 'Europe/Warsaw')) >= NOW()").
			OrderExpr("((s.date || ' ' || s.start_time)::timestamp AT TIME ZONE COALESCE(NULLIF(s.timezone, ''), 'Europe/Warsaw')) ASC").
			Limit(1).
			Scan(ctx, &row)
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return connect.NewResponse(&corev1.GetNextSessionResponse{}), nil
		}
		return nil, err
	}

	sessionResp, err := s.GetMethod.Get(ctx, connect.NewRequest(&v1.GetRequest{ID: row.Id}))
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&corev1.GetNextSessionResponse{
		Session: sessionResp.Msg,
	}), nil
}

func (s *SessionService) AddPaymentLink(ctx context.Context, req *connect.Request[corev1.AddPaymentLinkRequest]) (*connect.Response[corev1.Session], error) {
	// Fetch the session from the database
	session, err := s.repository.Get(ctx, req.Msg.SessionId, &repository.GetExtraProps[model.Session, corev1.Session, corev1.SaveSessionRequest]{})
	if err != nil {
		return nil, err
	}

	// Validate session has required fields
	if session.Price.IsZero() || session.Date == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("session must have price and date"))
	}

	// Create description
	description := fmt.Sprintf("Therapy Session - %s", session.Date)

	upsertResp, err := s.paymentClient.UpsertSessionPaymentLink(ctx, withPaymentHeaders(
		ctx,
		connect.NewRequest(&paymentv1.UpsertSessionPaymentLinkRequest{
			PaymentLinkId: session.PaymentLinkId,
			Amount:        session.Price.String(),
			Currency:      "pln",
			Description:   description,
		}),
		session.Id,
		session.CreatedBy,
	))
	if err != nil {
		return nil, err
	}

	paymentLinkType := int(corev1.SessionPaymentType_SESSION_PAYMENT_TYPE_PAYMENT_LINK)
	if upsertResp.Msg.Id != "" && (session.PaymentLinkId == nil || *session.PaymentLinkId != upsertResp.Msg.Id) {
		paymentLinkID := upsertResp.Msg.Id
		err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			_, err := tx.NewUpdate().
				Model((*model.Session)(nil)).
				Set("payment_link_id = ?", paymentLinkID).
				Set("payment_type = ?", paymentLinkType).
				Where("id = ?", session.Id).
				Exec(ctx)
			return err
		})
		if err != nil {
			return nil, err
		}
	} else if session.PaymentType == nil || *session.PaymentType != paymentLinkType {
		err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			_, err := tx.NewUpdate().
				Model((*model.Session)(nil)).
				Set("payment_type = ?", paymentLinkType).
				Where("id = ?", session.Id).
				Exec(ctx)
			return err
		})
		if err != nil {
			return nil, err
		}
	}

	// Return the updated session using GetMethod
	return s.GetMethod.Get(ctx, connect.NewRequest(&v1.GetRequest{ID: session.Id}))
}

// GetSessionsForPriceUpdate fetches sessions matching the given therapy IDs and date range
// for display in the price-update preview.
func (s *SessionService) GetSessionsForPriceUpdate(ctx context.Context, req *connect.Request[corev1.GetSessionsForPriceUpdateRequest]) (*connect.Response[corev1.GetSessionsForPriceUpdateResponse], error) {
	dateFrom := req.Msg.DateFrom

	type sessionRow struct {
		Id             string  `bun:"id"`
		Date           string  `bun:"date"`
		StartTime      string  `bun:"start_time"`
		EndTime        string  `bun:"end_time"`
		Price          string  `bun:"price"`
		TherapyLabel   *string `bun:"therapy_label"`
		TherapistLabel *string `bun:"therapist_label"`
		RoomLabel      *string `bun:"room_label"`
		IsOnline       *bool   `bun:"is_online"`
		TherapyPrice   *string `bun:"therapy_price"`
	}

	var rows []sessionRow

	q := s.db.NewSelect().
		TableExpr("core.session AS s").
		ColumnExpr("s.id").
		ColumnExpr("s.date").
		ColumnExpr("s.start_time").
		ColumnExpr("s.end_time").
		ColumnExpr("s.price::text AS price").
		ColumnExpr("t.display_name AS therapy_label").
		ColumnExpr("u.display_name AS therapist_label").
		ColumnExpr("r.display_name::text AS room_label").
		ColumnExpr("s.is_online").
		ColumnExpr("t.session_price::text AS therapy_price").
		Join("LEFT JOIN core.therapy AS t ON t.id = s.therapy_id").
		Join("LEFT JOIN core.therapist AS th ON th.id = s.therapist_id").
		Join("LEFT JOIN core.\"user\" AS u ON u.id = th.user_id").
		Join("LEFT JOIN core.room AS r ON r.id = s.room_id").
		Where("s.therapy_id IN (?)", bun.In(req.Msg.TherapyIds)).
		Where("s.deleted_at IS NULL").
		Where("s.cancelled_at IS NULL").
		OrderExpr("s.date ASC, s.start_time ASC")

	if dateFrom != "" {
		q = q.Where("s.date >= ?", dateFrom)
	}

	if req.Msg.DateUntil != "" {
		q = q.Where("s.date <= ?", req.Msg.DateUntil)
	}

	if err := q.Scan(ctx, &rows); err != nil {
		s.log.Error("failed to fetch sessions for price update",
			zap.Strings("therapyIds", req.Msg.TherapyIds),
			zap.Error(err))
		return nil, err
	}

	previews := make([]*corev1.SessionPriceUpdatePreview, len(rows))
	for i, r := range rows {
		previews[i] = &corev1.SessionPriceUpdatePreview{
			Id:             r.Id,
			Date:           model.NormalizeDateString(r.Date),
			StartTime:      r.StartTime,
			EndTime:        r.EndTime,
			Price:          r.Price,
			TherapyLabel:   r.TherapyLabel,
			TherapistLabel: r.TherapistLabel,
			RoomLabel:      r.RoomLabel,
			IsOnline:       r.IsOnline,
			TherapyPrice:   r.TherapyPrice,
		}
	}

	return connect.NewResponse(&corev1.GetSessionsForPriceUpdateResponse{
		Sessions: previews,
		Count:    int32(len(previews)),
	}), nil
}

// BulkUpdateSessionPrice sets the price column for the given session IDs.
func (s *SessionService) BulkUpdateSessionPrice(ctx context.Context, req *connect.Request[corev1.BulkUpdateSessionPriceRequest]) (*connect.Response[corev1.BulkUpdateSessionPriceResponse], error) {
	newPrice, err := decimal.NewFromString(req.Msg.Price)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("invalid price value: %w", err))
	}

	var rowsAffected int64
	err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		result, err := tx.NewUpdate().
			TableExpr("core.session").
			Set("price = ?", newPrice).
			Where("id IN (?)", bun.In(req.Msg.SessionIds)).
			Where("deleted_at IS NULL").
			Exec(ctx)
		if err != nil {
			return err
		}
		rowsAffected, _ = result.RowsAffected()
		return nil
	})
	if err != nil {
		s.log.Error("failed to bulk update session prices",
			zap.Int("sessionCount", len(req.Msg.SessionIds)),
			zap.Error(err))
		return nil, api.CommonApiErrorHandler(err)
	}

	s.log.Info("bulk updated session prices",
		zap.Int64("updatedCount", rowsAffected),
		zap.String("newPrice", req.Msg.Price))

	return connect.NewResponse(&corev1.BulkUpdateSessionPriceResponse{
		UpdatedCount: int32(rowsAffected),
	}), nil
}
