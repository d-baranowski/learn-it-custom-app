package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"fmt"
	"pkg/api"
	v1 "pkg/request/gen/request/v1"
	"pkg/tracing"
	"time"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"

	"pkg/repository"
	"pkg/unix"

	// for time parsing
	_ "time/tzdata"
)

type TherapyService struct {
	repository *repository.Repository[model.Therapy, corev1.Therapy, corev1.SaveTherapyRequest]
	db         *bun.DB
	config     *repository.Config
	log        *zap.Logger

	api.AutocompleteMethod[model.Therapy]
	api.GetMethod[model.Therapy, corev1.Therapy]
	api.ListMethod[model.Therapy, corev1.ListTherapyResponse]
	api.CreateMethod[model.Therapy, corev1.SaveTherapyRequest, corev1.Therapy]
	api.UpdateMethod[model.Therapy, corev1.SaveTherapyRequest, corev1.Therapy]
	api.SoftDeleteMethod[model.Therapy]
	api.DeleteMethod[model.Therapy]
}

func TherapyServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.therapy")

	s := api.NewService[
		TherapyService,
		model.Therapy,

		corev1.Therapy,
		corev1.ListTherapyResponse,
		corev1.SaveTherapyRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.Therapy, corev1.Therapy, corev1.SaveTherapyRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)
	s.db = props.DB
	s.config = props.Config
	s.log = props.Log

	// Pre-hook to validate that room is required when there are offline sessions
	validateRoomForOfflineSessions := func(ctx context.Context, tx bun.Tx, therapy *model.Therapy, extra *repository.ExtraInfoReq[corev1.SaveTherapyRequest]) error {
		for i, freq := range therapy.SessionFrequency {
			if freq.IsOnline {
				continue
			}
			if freq.RoomId == nil || *freq.RoomId == "" {
				return fmt.Errorf("room is required for offline session frequency entry %d", i+1)
			}
		}

		return nil
	}

	s.CreateMethod.AddPreHook(validateRoomForOfflineSessions)
	s.UpdateMethod.AddPreHook(validateRoomForOfflineSessions)

	s.GetMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, id string, result *model.Therapy, extra *repository.ExtraInfoReqResp[v1.GetRequest, corev1.Therapy]) error {
		// Load customerIds from therapy_customer join table.
		//
		// Uses the OUTER transaction — this previously called s.repository.Run,
		// acquiring a second connection from the same pool while still holding
		// the first. Same deadlock as SessionService/Get; see
		// infrastructure/INCIDENT-2026-07-29-db-pool-deadlock.md.
		queryResult := make([]*model.TherapyCustomer, 0)

		if err := tx.NewSelect().
			Model(&queryResult).
			Column("customer_id").
			Limit(1000).
			Where("therapy_id = ?", result.Id).
			Scan(ctx); err != nil {
			props.Log.Error("error fetching therapy customers", zap.Error(err))
			return err
		}

		customerIds := make([]string, len(queryResult))
		for i, tc := range queryResult {
			customerIds[i] = tc.CustomerId
		}
		extra.Response.CustomerIds = customerIds
		return nil
	})

	// Post-hook to handle customer relationships for Create
	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Therapy, extra *repository.ExtraInfoReqResp[corev1.SaveTherapyRequest, corev1.Therapy]) error {
		return handleTherapyCustomers(ctx, tx, result, extra.Request.CustomerIds)
	})

	// Post-hook to automatically create therapist_customer links when therapy is created
	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Therapy, extra *repository.ExtraInfoReqResp[corev1.SaveTherapyRequest, corev1.Therapy]) error {
		return ensureTherapistCustomerLinks(ctx, tx, result.TherapistId, extra.Request.CustomerIds, result.CreatedBy)
	})

	// Post-hook to handle customer relationships for Update
	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Therapy, extra *repository.ExtraInfoReqResp[corev1.SaveTherapyRequest, corev1.Therapy]) error {
		return handleTherapyCustomers(ctx, tx, result, extra.Request.CustomerIds)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTherapyServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

// isRoomAvailable checks if a room is available during the given time slot.
// Returns true if the room has no overlapping sessions.
// Uses date + time string comparison for overlap detection.
func isRoomAvailable(ctx context.Context, db bun.IDB, roomId, date, startTime, endTime string) (bool, error) {
	count, err := db.NewSelect().
		Table("core.session").
		Where("room_id = ?", roomId).
		Where("deleted_at IS NULL").
		Where("cancelled_at IS NULL").
		Where("date = ?", date).
		Where("start_time < ?", endTime).
		Where("end_time > ?", startTime).
		Count(ctx)
	if err != nil {
		return false, err
	}

	return count == 0, nil
}

// validateGenerateRange validates generateFrom/generateUntil date strings and returns the resolved time range.
// generateFrom defaults to today when empty. The span must be at most 12 months.
func validateGenerateRange(generateFrom, generateUntil string) (time.Time, time.Time, error) {
	now := time.Now()
	var from time.Time
	if generateFrom != "" {
		parsed, err := time.Parse("2006-01-02", generateFrom)
		if err != nil {
			return time.Time{}, time.Time{}, fmt.Errorf("invalid generateFrom date %q: %w", generateFrom, err)
		}
		from = parsed
	} else {
		from = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	}

	until, err := time.Parse("2006-01-02", generateUntil)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid generateUntil date %q: %w", generateUntil, err)
	}

	if until.Before(from) {
		return time.Time{}, time.Time{}, fmt.Errorf("generateUntil must be after generateFrom")
	}

	maxSpan := from.AddDate(0, 12, 1) // 12 months + 1 day buffer
	if until.After(maxSpan) {
		return time.Time{}, time.Time{}, fmt.Errorf("date range must be at most 12 months")
	}

	return from, until, nil
}

// generateSessionsForTherapy expands a therapy's session frequency into concrete sessions
// within the generateFrom..generateUntil window and links customers.
// excludedIndices lists zero-based preview indices to skip.
// sessionOverrides contains per-session field overrides keyed by preview index.
func generateSessionsForTherapy(ctx context.Context, tx bun.Tx, therapy *model.Therapy, customerIds []string, timezoneStr string, generateFrom, generateUntil time.Time, excludedIndices map[int32]bool, sessionOverrides map[int32]*corev1.SessionOverride, log *zap.Logger) error {
	if len(therapy.SessionFrequency) == 0 {
		return nil
	}

	_ = log

	location, err := time.LoadLocation(timezoneStr)
	if err != nil {
		return fmt.Errorf("load timezone %q: %w", timezoneStr, err)
	}

	now := unix.Now()
	nowUtc := now.Time().UTC()

	// Use max(therapy.StartDate, generateFrom, now) so we only generate future sessions
	startUtc := therapy.StartDate.Time().UTC()
	fromUtc := generateFrom.UTC()
	if fromUtc.After(startUtc) {
		startUtc = fromUtc
	}
	if nowUtc.After(startUtc) {
		startUtc = nowUtc
	}
	start := time.Date(startUtc.Year(), startUtc.Month(), startUtc.Day(), 0, 0, 0, 0, location)
	end := generateUntil

	// Convert SessionFrequencyItem to FrequencyItem interface
	frequencies := make([]FrequencyItem, len(therapy.SessionFrequency))
	for i := range therapy.SessionFrequency {
		frequencies[i] = &therapy.SessionFrequency[i]
	}

	// Create a frequency generator with a session builder
	generator := NewFrequencyGenerator(
		start,
		end,
		location,
		frequencies,
		therapy.Id,
		therapy.CreatedBy,
		now,
		func(occurStart time.Time, startTimeMs int64, ref string, fi int) (*model.Session, error) {
			sessionDate, sessionStartTime := model.GoTimeToDateTimeStr(occurStart)
			endGoTime := occurStart.Add(time.Duration(therapy.SessionDuration) * time.Minute)
			_, sessionEndTime := model.GoTimeToDateTimeStr(endGoTime)

			var roomId *string
			isOnline := false
			if fi < len(therapy.SessionFrequency) {
				freq := therapy.SessionFrequency[fi]
				isOnline = freq.IsOnline
				if !freq.IsOnline {
					if freq.RoomId == nil || *freq.RoomId == "" {
						return nil, fmt.Errorf("room is required for offline session frequency entry %d", fi+1)
					}
					roomId = freq.RoomId
				}
			}

			displayName := therapy.DisplayName

			return &model.Session{
				TherapyId:                  &therapy.Id,
				TherapistId:                therapy.TherapistId,
				RoomId:                     roomId,
				Date:                       sessionDate,
				StartTime:                  sessionStartTime,
				EndTime:                    sessionEndTime,
				Timezone:                   timezoneStr,
				Price:                      therapy.SessionPrice,
				TherapySessionFrequencyRef: &ref,
				IsOnline:                   &isOnline,
				DisplayName:                &displayName,
				CreatedAt:                  now,
				CreatedBy:                  therapy.CreatedBy,
			}, nil
		},
	)

	// Generate sessions
	sessions, err := generator.Generate()
	if err != nil {
		return err
	}

	if len(sessions) == 0 {
		return nil
	}

	// Apply exclusions and overrides
	var kept []*model.Session
	for i, sess := range sessions {
		idx := int32(i)
		if excludedIndices[idx] {
			continue
		}

		// Apply per-session overrides
		if ovr, ok := sessionOverrides[idx]; ok {
			if ovr.Date != nil {
				sess.Date = *ovr.Date
			}
			if ovr.StartTime != nil {
				sess.StartTime = *ovr.StartTime
			}
			if ovr.EndTime != nil {
				sess.EndTime = *ovr.EndTime
			}
			if ovr.RoomId != nil {
				roomCopy := *ovr.RoomId
				sess.RoomId = &roomCopy
			}
			if ovr.IsOnline != nil {
				onlineCopy := *ovr.IsOnline
				sess.IsOnline = &onlineCopy
			}
		}

		kept = append(kept, sess)
	}

	if len(kept) == 0 {
		return nil
	}

	// Server-side duplicate guard: remove sessions that already exist in the DB
	// (matching therapy_id + date + start_time for frequency-generated sessions).
	{
		minDate := kept[0].Date
		maxDate := kept[0].Date
		for _, sess := range kept[1:] {
			if sess.Date < minDate {
				minDate = sess.Date
			}
			if sess.Date > maxDate {
				maxDate = sess.Date
			}
		}

		var existingSessions []model.Session
		if err := tx.NewSelect().
			Model(&existingSessions).
			Column("date", "start_time").
			Where("therapy_id = ?", therapy.Id).
			Where("therapy_session_frequency_ref IS NOT NULL").
			Where("deleted_at IS NULL").
			Where("cancelled_at IS NULL").
			Where("date >= ?", minDate).
			Where("date <= ?", maxDate).
			Scan(ctx); err == nil && len(existingSessions) > 0 {
			existingKeys := make(map[string]bool, len(existingSessions))
			for _, es := range existingSessions {
				existingKeys[model.NormalizeDateString(es.Date)+"|"+es.StartTime] = true
			}
			deduped := make([]*model.Session, 0, len(kept))
			for _, sess := range kept {
				if !existingKeys[sess.Date+"|"+sess.StartTime] {
					deduped = append(deduped, sess)
				}
			}
			kept = deduped
		}
	}

	if len(kept) == 0 {
		return nil
	}

	// Insert sessions in bulk.
	if _, err := tx.NewInsert().Model(&kept).Exec(ctx); err != nil {
		return err
	}

	// Link customers to each session.
	if len(customerIds) > 0 {
		sessionCustomers := make([]*model.SessionCustomer, 0, len(kept)*len(customerIds))
		for _, sess := range kept {
			for _, cid := range customerIds {
				sessionCustomers = append(sessionCustomers, &model.SessionCustomer{
					SessionId:  sess.Id,
					CustomerId: cid,
					CreatedAt:  now,
					CreatedBy:  therapy.CreatedBy,
				})
			}
		}
		if len(sessionCustomers) > 0 {
			if _, err := tx.NewInsert().Model(&sessionCustomers).Exec(ctx); err != nil {
				return err
			}
		}
	}

	return nil
}

// extendTherapyGeneratedWindow widens the therapy's [sessions_generated_at, sessions_generated_till]
// window to cover the just-generated [generateFrom, generateUntil] range. Both columns are nullable;
// the union is computed NULL-safely so a never-generated therapy is initialised to the new range.
// The therapy struct is updated in place so callers see the new values.
func extendTherapyGeneratedWindow(ctx context.Context, tx bun.Tx, therapy *model.Therapy, generateFrom, generateUntil time.Time) error {
	fromTs := unix.GoTimeToTimestamp(generateFrom)
	untilTs := unix.GoTimeToTimestamp(generateUntil)

	newAt := fromTs
	if therapy.SessionsGeneratedAt != nil && therapy.SessionsGeneratedAt.Before(newAt) {
		newAt = *therapy.SessionsGeneratedAt
	}
	newTill := untilTs
	if therapy.SessionsGeneratedTill != nil && therapy.SessionsGeneratedTill.After(newTill) {
		newTill = *therapy.SessionsGeneratedTill
	}

	if _, err := tx.NewUpdate().
		Model((*model.Therapy)(nil)).
		Set("sessions_generated_at = ?", newAt).
		Set("sessions_generated_till = ?", newTill).
		Where("id = ?", therapy.Id).
		Exec(ctx); err != nil {
		return err
	}

	therapy.SessionsGeneratedAt = &newAt
	therapy.SessionsGeneratedTill = &newTill
	return nil
}

// handleTherapyCustomers manages the many-to-many relationship between therapies and customers
func handleTherapyCustomers(ctx context.Context, db bun.IDB, therapy *model.Therapy, customerIds []string) error {
	// Delete existing relationships
	_, err := db.NewDelete().
		Model((*model.TherapyCustomer)(nil)).
		Where("therapy_id = ?", therapy.Id).
		Exec(ctx)
	if err != nil {
		return err
	}

	// Create new relationships
	if len(customerIds) > 0 {
		now := unix.Now()
		therapyCustomers := make([]*model.TherapyCustomer, len(customerIds))
		for i, customerId := range customerIds {
			therapyCustomers[i] = &model.TherapyCustomer{
				TherapyId:  therapy.Id,
				CustomerId: customerId,
				CreatedAt:  now,
				CreatedBy:  therapy.CreatedBy,
			}
		}

		_, err = db.NewInsert().
			Model(&therapyCustomers).
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

// ensureTherapistCustomerLinks creates therapist_customer entries for all customers
// in the therapy, unless they already exist. This ensures therapists can see the customers
// they're working with. Runs within the same transaction as therapy creation.
func ensureTherapistCustomerLinks(ctx context.Context, tx bun.Tx, therapistId string, customerIds []string, createdBy string) error {
	if len(customerIds) == 0 {
		return nil
	}

	// Get existing therapist_customer links for this therapist
	var existingLinks []struct {
		CustomerId string `bun:"customer_id"`
	}

	err := tx.NewSelect().
		Model((*model.TherapistCustomer)(nil)).
		Column("customer_id").
		Where("therapist_id = ?", therapistId).
		Where("customer_id IN (?)", bun.In(customerIds)).
		Scan(ctx, &existingLinks)
	if err != nil {
		return err
	}

	// Build a set of existing customer IDs
	existingCustomerIds := make(map[string]bool)
	for _, link := range existingLinks {
		existingCustomerIds[link.CustomerId] = true
	}

	// Create links for customers that don't already have one
	newLinks := make([]*model.TherapistCustomer, 0)
	now := unix.Now()

	for _, customerId := range customerIds {
		if !existingCustomerIds[customerId] {
			newLinks = append(newLinks, &model.TherapistCustomer{
				TherapistId: therapistId,
				CustomerId:  customerId,
				CreatedAt:   now,
				CreatedBy:   createdBy,
			})
		}
	}

	if len(newLinks) > 0 {
		_, err = tx.NewInsert().
			Model(&newLinks).
			Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}

// DryRunGenerateSessions previews sessions that would be generated from a therapy's frequency
// without actually creating them. Uses generateFrom..generateUntil to define the generation window.
func (s *TherapyService) DryRunGenerateSessions(ctx context.Context, req *connect.Request[corev1.DryRunGenerateSessionsRequest]) (*connect.Response[corev1.DryRunGenerateSessionsResponse], error) {
	generateFrom, generateUntil, err := validateGenerateRange(req.Msg.GenerateFrom, req.Msg.GenerateUntil)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	therapy, err := s.repository.Get(ctx, req.Msg.TherapyId, &repository.GetExtraProps[model.Therapy, corev1.Therapy, corev1.SaveTherapyRequest]{})
	if err != nil {
		return nil, err
	}

	if len(therapy.SessionFrequency) == 0 {
		return connect.NewResponse(&corev1.DryRunGenerateSessionsResponse{
			Sessions: []*corev1.SessionPreview{},
			Count:    0,
		}), nil
	}

	sessions, err := s.generateSessionPreviews(ctx, therapy, generateFrom, generateUntil)
	if err != nil {
		return nil, err
	}

	previews, err := s.buildSessionPreviews(ctx, therapy.Id, sessions)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&corev1.DryRunGenerateSessionsResponse{
		Sessions: previews,
		Count:    int32(len(previews)),
	}), nil
}

// GenerateSessions generates and persists sessions from a therapy's frequency configuration.
// Uses generateFrom..generateUntil to define the generation window.
// Supports excludedIndices to skip specific sessions and sessionOverrides for per-session edits.
func (s *TherapyService) GenerateSessions(ctx context.Context, req *connect.Request[corev1.GenerateSessionsRequest]) (*connect.Response[corev1.GenerateSessionsResponse], error) {
	generateFrom, generateUntil, err := validateGenerateRange(req.Msg.GenerateFrom, req.Msg.GenerateUntil)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	therapy, err := s.repository.Get(ctx, req.Msg.TherapyId, &repository.GetExtraProps[model.Therapy, corev1.Therapy, corev1.SaveTherapyRequest]{})
	if err != nil {
		return nil, err
	}

	if len(therapy.SessionFrequency) == 0 {
		return connect.NewResponse(&corev1.GenerateSessionsResponse{
			GeneratedCount: 0,
		}), nil
	}

	customerIds, err := s.loadTherapyCustomerIds(ctx, therapy.Id)
	if err != nil {
		return nil, err
	}

	// Build exclusion set
	excludedSet := make(map[int32]bool, len(req.Msg.ExcludedIndices))
	for _, idx := range req.Msg.ExcludedIndices {
		excludedSet[idx] = true
	}

	// Build override map
	overrideMap := make(map[int32]*corev1.SessionOverride, len(req.Msg.SessionOverrides))
	for _, ovr := range req.Msg.SessionOverrides {
		overrideMap[ovr.Index] = ovr
	}

	var generatedCount int32
	err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		if genErr := generateSessionsForTherapy(ctx, tx, therapy, customerIds, s.config.Timezone, generateFrom, generateUntil, excludedSet, overrideMap, s.log); genErr != nil {
			return genErr
		}

		if winErr := extendTherapyGeneratedWindow(ctx, tx, therapy, generateFrom, generateUntil); winErr != nil {
			return winErr
		}

		// Count future generated sessions: date >= today
		today := time.Now().Format("2006-01-02")
		count, countErr := tx.NewSelect().
			Table("core.session").
			Where("therapy_id = ?", therapy.Id).
			Where("therapy_session_frequency_ref IS NOT NULL").
			Where("date >= ?", today).
			Count(ctx)
		if countErr != nil {
			return countErr
		}
		generatedCount = int32(count)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&corev1.GenerateSessionsResponse{
		GeneratedCount: generatedCount,
	}), nil
}

// GetFutureGeneratedSessions lists future auto-generated sessions that would be deleted
// if the session frequency is modified.
func (s *TherapyService) GetFutureGeneratedSessions(ctx context.Context, req *connect.Request[corev1.GetFutureGeneratedSessionsRequest]) (*connect.Response[corev1.GetFutureGeneratedSessionsResponse], error) {
	today := time.Now().Format("2006-01-02")

	var sessions []model.Session
	err := s.db.NewSelect().
		Model(&sessions).
		Where("therapy_id = ?", req.Msg.TherapyId).
		Where("therapy_session_frequency_ref IS NOT NULL").
		Where("date >= ?", today).
		Where("deleted_at IS NULL").
		Where("cancelled_at IS NULL").
		OrderExpr("date ASC, start_time ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Convert to pointer slice for buildSessionPreviews
	sessionPtrs := make([]*model.Session, len(sessions))
	for i := range sessions {
		sessionPtrs[i] = &sessions[i]
	}

	previews, err := s.buildSessionPreviews(ctx, req.Msg.TherapyId, sessionPtrs)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&corev1.GetFutureGeneratedSessionsResponse{
		Sessions: previews,
		Count:    int32(len(previews)),
	}), nil
}

// DeleteFutureGeneratedSessions removes all future auto-generated sessions for a therapy.
func (s *TherapyService) DeleteFutureGeneratedSessions(ctx context.Context, req *connect.Request[corev1.DeleteFutureGeneratedSessionsRequest]) (*connect.Response[corev1.DeleteFutureGeneratedSessionsResponse], error) {
	today := time.Now().Format("2006-01-02")

	result, err := s.db.NewDelete().
		Model((*model.Session)(nil)).
		Where("therapy_id = ?", req.Msg.TherapyId).
		Where("therapy_session_frequency_ref IS NOT NULL").
		Where("date >= ?", today).
		Exec(ctx)
	if err != nil {
		s.log.Error("failed to delete future generated sessions",
			zap.String("therapyId", req.Msg.TherapyId),
			zap.Error(err))
		return nil, err
	}

	rowsDeleted, _ := result.RowsAffected()
	s.log.Info("deleted future auto-generated sessions",
		zap.String("therapyId", req.Msg.TherapyId),
		zap.Int64("rowsDeleted", rowsDeleted))

	return connect.NewResponse(&corev1.DeleteFutureGeneratedSessionsResponse{
		DeletedCount: int32(rowsDeleted),
	}), nil
}

// GetLastSessionDate returns the date of the most recent non-deleted, non-cancelled session
// for the given therapy. Returns nil lastSessionDate if no sessions exist.
func (s *TherapyService) GetLastSessionDate(ctx context.Context, req *connect.Request[corev1.GetLastSessionDateRequest]) (*connect.Response[corev1.GetLastSessionDateResponse], error) {
	var lastDate *string
	err := s.db.NewSelect().
		Model((*model.Session)(nil)).
		ColumnExpr("MAX(date)").
		Where("therapy_id = ?", req.Msg.TherapyId).
		Where("deleted_at IS NULL").
		Where("cancelled_at IS NULL").
		Scan(ctx, &lastDate)
	if err != nil {
		return nil, err
	}

	resp := &corev1.GetLastSessionDateResponse{}
	if lastDate != nil && *lastDate != "" {
		normalized := model.NormalizeDateString(*lastDate)
		resp.LastSessionDate = &normalized
	}

	return connect.NewResponse(resp), nil
}

// generateSessionPreviews generates preview sessions in memory without persisting them.
// Uses the therapy's default room and checks for clashes instead of auto-finding rooms.
func (s *TherapyService) generateSessionPreviews(ctx context.Context, therapy *model.Therapy, generateFrom, generateUntil time.Time) ([]*model.Session, error) {
	location, err := time.LoadLocation(s.config.Timezone)
	if err != nil {
		return nil, fmt.Errorf("load timezone %q: %w", s.config.Timezone, err)
	}

	now := unix.Now()
	nowUtc := now.Time().UTC()

	// Use max(therapy.StartDate, generateFrom, now) so we only generate future sessions
	startUtc := therapy.StartDate.Time().UTC()
	fromUtc := generateFrom.UTC()
	if fromUtc.After(startUtc) {
		startUtc = fromUtc
	}
	if nowUtc.After(startUtc) {
		startUtc = nowUtc
	}
	start := time.Date(startUtc.Year(), startUtc.Month(), startUtc.Day(), 0, 0, 0, 0, location)
	end := generateUntil

	frequencies := make([]FrequencyItem, len(therapy.SessionFrequency))
	for i := range therapy.SessionFrequency {
		frequencies[i] = &therapy.SessionFrequency[i]
	}

	generator := NewFrequencyGenerator(
		start,
		end,
		location,
		frequencies,
		therapy.Id,
		therapy.CreatedBy,
		now,
		func(occurStart time.Time, startTimeMs int64, ref string, fi int) (*model.Session, error) {
			sessionDate, sessionStartTime := model.GoTimeToDateTimeStr(occurStart)
			endGoTime := occurStart.Add(time.Duration(therapy.SessionDuration) * time.Minute)
			_, sessionEndTime := model.GoTimeToDateTimeStr(endGoTime)

			var roomId *string
			isOnline := false
			if fi < len(therapy.SessionFrequency) {
				freq := therapy.SessionFrequency[fi]
				isOnline = freq.IsOnline
				if !freq.IsOnline {
					if freq.RoomId == nil || *freq.RoomId == "" {
						return nil, fmt.Errorf("room is required for offline session frequency entry %d", fi+1)
					}
					roomId = freq.RoomId
				}
			}

			return &model.Session{
				TherapyId:                  &therapy.Id,
				TherapistId:                therapy.TherapistId,
				RoomId:                     roomId,
				Date:                       sessionDate,
				StartTime:                  sessionStartTime,
				EndTime:                    sessionEndTime,
				Timezone:                   s.config.Timezone,
				Price:                      therapy.SessionPrice,
				TherapySessionFrequencyRef: &ref,
				IsOnline:                   &isOnline,
			}, nil
		},
	)

	return generator.Generate()
}

// loadTherapyCustomerIds loads the customer IDs for a therapy from the join table.
func (s *TherapyService) loadTherapyCustomerIds(ctx context.Context, therapyId string) ([]string, error) {
	var results []*model.TherapyCustomer
	err := s.db.NewSelect().
		Model(&results).
		Column("customer_id").
		Where("therapy_id = ?", therapyId).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	ids := make([]string, len(results))
	for i, r := range results {
		ids[i] = r.CustomerId
	}
	return ids, nil
}

// buildSessionPreviews converts model sessions into proto SessionPreview objects
// with room label lookups, room clash detection, and duplicate detection.
// therapyId is used to query existing sessions and mark duplicates.
func (s *TherapyService) buildSessionPreviews(ctx context.Context, therapyId string, sessions []*model.Session) ([]*corev1.SessionPreview, error) {
	// Load existing sessions for this therapy to detect duplicates.
	// We look for active (non-deleted, non-cancelled) sessions that overlap
	// the date range of the previews being generated.
	existingKeys := make(map[string]bool)
	if len(sessions) > 0 {
		// Find the min/max date range of generated previews
		minDate := sessions[0].Date
		maxDate := sessions[0].Date
		for _, sess := range sessions[1:] {
			if sess.Date < minDate {
				minDate = sess.Date
			}
			if sess.Date > maxDate {
				maxDate = sess.Date
			}
		}

		var existingSessions []model.Session
		err := s.db.NewSelect().
			Model(&existingSessions).
			Column("date", "start_time").
			Where("therapy_id = ?", therapyId).
			Where("therapy_session_frequency_ref IS NOT NULL").
			Where("deleted_at IS NULL").
			Where("cancelled_at IS NULL").
			Where("date >= ?", minDate).
			Where("date <= ?", maxDate).
			Scan(ctx)
		if err != nil {
			s.log.Warn("failed to query existing sessions for duplicate detection",
				zap.String("therapyId", therapyId),
				zap.Error(err))
			// Non-fatal: continue without duplicate detection
		} else {
			for _, existing := range existingSessions {
				existingKeys[model.NormalizeDateString(existing.Date)+"|"+existing.StartTime] = true
			}
		}
	}

	previews := make([]*corev1.SessionPreview, len(sessions))
	for i, sess := range sessions {
		preview := &corev1.SessionPreview{
			Date:      sess.Date,
			StartTime: sess.StartTime,
			EndTime:   sess.EndTime,
			IsOnline:  sess.IsOnline != nil && *sess.IsOnline,
		}
		if sess.TherapySessionFrequencyRef != nil {
			preview.TherapySessionFrequencyRef = *sess.TherapySessionFrequencyRef
		}

		// Check if this session already exists (duplicate detection)
		if existingKeys[sess.Date+"|"+sess.StartTime] {
			preview.AlreadyExists = true
		}

		if sess.RoomId != nil && *sess.RoomId != "" {
			preview.RoomId = sess.RoomId
			roomLabel, err := s.getRoomLabel(ctx, *sess.RoomId)
			if err == nil && roomLabel != nil {
				preview.RoomLabel = roomLabel
			}

			// Check for room clash — skip for duplicates because the "clash"
			// would be the therapy's own existing session occupying the room.
			if !preview.AlreadyExists {
				available, err := isRoomAvailable(ctx, s.db, *sess.RoomId, sess.Date, sess.StartTime, sess.EndTime)
				if err != nil {
					s.log.Warn("failed to check room availability for preview",
						zap.String("roomId", *sess.RoomId),
						zap.Error(err))
				} else {
					preview.HasRoomClash = !available
				}
			}
		}
		previews[i] = preview
	}
	return previews, nil
}

// getRoomLabel looks up the display name for a room by its ID.
func (s *TherapyService) getRoomLabel(ctx context.Context, roomId string) (*string, error) {
	var label string
	err := s.db.NewSelect().
		Table("core.room").
		Column("display_name").
		Where("id = ?", roomId).
		Where("deleted_at IS NULL").
		Scan(ctx, &label)
	if err != nil {
		return nil, err
	}
	if label == "" {
		return nil, nil
	}
	return &label, nil
}
