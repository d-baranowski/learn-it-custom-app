package calendar

import (
	calendarv1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"pkg/unix"
	"pkg/util"

	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

// querySessionsByTherapistIdsAndServiceIds fetches sessions filtered by therapist IDs and service IDs.
// startDate and endDate are unix.Timestamp (Unix ms). Sessions are matched by date range with a
// 1-day buffer on each side to account for timezone differences.
func (h *Service) querySessionsByTherapistIdsAndServiceIds(ctx context.Context, startDate, endDate unix.Timestamp, therapistIds []string, serviceIds []string) ([]model.Session, error) {
	var sessions []model.Session

	// Convert timestamps to date strings for efficient DB filtering.
	// We widen the date range by 1 day on each side to account for timezone differences.
	startDateStr := startDate.Time().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	endDateStr := endDate.Time().UTC().AddDate(0, 0, 1).Format("2006-01-02")

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		query := tx.NewSelect().
			Model(&sessions).
			Relation("Therapy").
			Relation("Room").
			ColumnExpr("session.*").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL")

		if len(therapistIds) > 0 {
			query = query.Where("session.therapist_id IN (?)", bun.In(therapistIds))
		}

		if len(serviceIds) > 0 {
			query = query.Where("therapy.service_id IN (?)", bun.In(serviceIds))
		}

		return query.Scan(ctx)
	})

	if err != nil {
		h.log.Error("Failed to query sessions by therapist IDs", zap.Error(err))
		return nil, err
	}

	return sessions, nil
}

// querySessionsByRoomIds fetches sessions filtered by room IDs
func (h *Service) querySessionsByRoomIds(ctx context.Context, startDate, endDate unix.Timestamp, roomIds []string) ([]model.Session, error) {
	var sessions []model.Session

	startDateStr := startDate.Time().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	endDateStr := endDate.Time().UTC().AddDate(0, 0, 1).Format("2006-01-02")

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		query := tx.NewSelect().
			Model(&sessions).
			Relation("Therapy").
			Relation("Therapist").
			Relation("Therapist.User").
			ColumnExpr("session.*").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL").
			Where("session.room_id IS NOT NULL")

		if len(roomIds) > 0 {
			query = query.Where("session.room_id IN (?)", bun.In(roomIds))
		}

		return query.Scan(ctx)
	})

	if err != nil {
		h.log.Error("Failed to query sessions by room IDs", zap.Error(err))
		return nil, err
	}

	return sessions, nil
}

// sessionDayCount is a single calendar day's aggregated session count.
type sessionDayCount struct {
	Date  string `bun:"date"`
	Count int32  `bun:"count"`
}

// countSessionsByTherapistIdsAndServiceIds returns per-day session counts for the
// therapist calendar heatmap. It mirrors the filters of
// querySessionsByTherapistIdsAndServiceIds but aggregates in the database instead
// of loading full session models.
func (h *Service) countSessionsByTherapistIdsAndServiceIds(ctx context.Context, startDate, endDate unix.Timestamp, therapistIds, serviceIds []string) ([]sessionDayCount, error) {
	var counts []sessionDayCount

	startDateStr := startDate.Time().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	endDateStr := endDate.Time().UTC().AddDate(0, 0, 1).Format("2006-01-02")

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		query := tx.NewSelect().
			Model((*model.Session)(nil)).
			ColumnExpr("session.date AS date").
			ColumnExpr("COUNT(*) AS count").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL").
			Group("session.date")

		if len(serviceIds) > 0 {
			query = query.
				Join("JOIN core.therapy AS therapy ON therapy.id = session.therapy_id").
				Where("therapy.service_id IN (?)", bun.In(serviceIds))
		}
		if len(therapistIds) > 0 {
			query = query.Where("session.therapist_id IN (?)", bun.In(therapistIds))
		}

		return query.Scan(ctx, &counts)
	})
	if err != nil {
		h.log.Error("Failed to count sessions by therapist IDs", zap.Error(err))
		return nil, err
	}

	return counts, nil
}

// countSessionsByRoomIds returns per-day session counts for the room calendar
// heatmap: room-assigned sessions (optionally filtered by room) plus online
// sessions, mirroring how GetRoomCalendarEvents composes its events.
func (h *Service) countSessionsByRoomIds(ctx context.Context, startDate, endDate unix.Timestamp, roomIds []string) ([]sessionDayCount, error) {
	var roomCounts []sessionDayCount
	var onlineCounts []sessionDayCount

	startDateStr := startDate.Time().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	endDateStr := endDate.Time().UTC().AddDate(0, 0, 1).Format("2006-01-02")

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		roomQuery := tx.NewSelect().
			Model((*model.Session)(nil)).
			ColumnExpr("session.date AS date").
			ColumnExpr("COUNT(*) AS count").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL").
			Where("session.room_id IS NOT NULL").
			Group("session.date")

		if len(roomIds) > 0 {
			roomQuery = roomQuery.Where("session.room_id IN (?)", bun.In(roomIds))
		}

		if err := roomQuery.Scan(ctx, &roomCounts); err != nil {
			return err
		}

		return tx.NewSelect().
			Model((*model.Session)(nil)).
			ColumnExpr("session.date AS date").
			ColumnExpr("COUNT(*) AS count").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL").
			Where("session.is_online = TRUE").
			Group("session.date").
			Scan(ctx, &onlineCounts)
	})
	if err != nil {
		h.log.Error("Failed to count sessions by room IDs", zap.Error(err))
		return nil, err
	}

	merged := make(map[string]int32, len(roomCounts)+len(onlineCounts))
	for _, c := range roomCounts {
		merged[c.Date] += c.Count
	}
	for _, c := range onlineCounts {
		merged[c.Date] += c.Count
	}

	result := make([]sessionDayCount, 0, len(merged))
	for date, count := range merged {
		result = append(result, sessionDayCount{Date: date, Count: count})
	}

	return result, nil
}

// queryOnlineSessions fetches online sessions (is_online = true) within the date range
func (h *Service) queryOnlineSessions(ctx context.Context, startDate, endDate unix.Timestamp) ([]model.Session, error) {
	var sessions []model.Session

	startDateStr := startDate.Time().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	endDateStr := endDate.Time().UTC().AddDate(0, 0, 1).Format("2006-01-02")

	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Model(&sessions).
			Relation("Therapy").
			Relation("Therapist").
			Relation("Therapist.User").
			ColumnExpr("session.*").
			Where("session.date >= ?", startDateStr).
			Where("session.date <= ?", endDateStr).
			Where("session.deleted_at IS NULL").
			Where("session.is_online = TRUE").
			Scan(ctx)
	})

	if err != nil {
		h.log.Error("Failed to query online sessions", zap.Error(err))
		return nil, err
	}

	return sessions, nil
}

// sessionToCalendarStartEnd converts a session's date+time+timezone to Unix ms start/end.
// On error it logs and returns 0,0.
func sessionToCalendarStartEnd(session *model.Session, log *zap.Logger) (int64, int64) {
	startMs, err := session.StartUnixMs()
	if err != nil {
		log.Warn("failed to convert session start to unix ms",
			zap.String("sessionId", session.Id),
			zap.Error(err))
		return 0, 0
	}
	endMs, err := session.EndUnixMs()
	if err != nil {
		log.Warn("failed to convert session end to unix ms",
			zap.String("sessionId", session.Id),
			zap.Error(err))
		return 0, 0
	}
	return startMs, endMs
}

// buildTherapistCalendarEvents converts sessions with room info to calendar events for therapist view
func buildTherapistCalendarEvents(sessions []model.Session, getResourceId func(*model.Session) string, lang string, log *zap.Logger) []*calendarv1.CalendarEvent {
	events := make([]*calendarv1.CalendarEvent, 0, len(sessions))

	for _, sessionData := range sessions {
		session := sessionData
		startMs, endMs := sessionToCalendarStartEnd(&session, log)
		if startMs == 0 && endMs == 0 {
			continue
		}

		title := ""
		if session.DisplayName != nil && *session.DisplayName != "" {
			title = *session.DisplayName
		} else if session.Therapy != nil {
			title = session.Therapy.DisplayName
		}

		event := &calendarv1.CalendarEvent{
			Id:         session.Id,
			Title:      title,
			Start:      startMs,
			End:        endMs,
			ResourceId: getResourceId(&session),
		}

		if session.PaidAt != nil {
			paidAt := session.PaidAt.Int64()
			event.PaidAt = &paidAt
		}
		if session.PaymentType != nil {
			pt := calendarv1.SessionPaymentType(*session.PaymentType)
			event.PaymentType = &pt
		}
		if session.CancelledAt != nil {
			cancelledAt := session.CancelledAt.Int64()
			event.CancelledAt = &cancelledAt
		}
		if session.CancellationReason != nil {
			event.CancellationReason = session.CancellationReason
		}
		if session.RoomId != nil {
			event.RoomId = session.RoomId
		}

		// Add room display info for therapist calendar
		if sessionData.Room != nil && util.Str(sessionData.Room.DisplayAbbreviation) != "" {
			event.DisplayAbbreviation = sessionData.Room.DisplayAbbreviation
		}
		if sessionData.Room != nil && util.Str(sessionData.Room.DisplayColor) != "" {
			event.DisplayColor = sessionData.Room.DisplayColor
		}
		if sessionData.Room != nil {
			displayName := ""
			if lang == "pl" && util.Str(sessionData.Room.DisplayName.Pl) != "" {
				displayName = util.Str(sessionData.Room.DisplayName.Pl)
			} else if lang == "en" && util.Str(sessionData.Room.DisplayName.En) != "" {
				displayName = util.Str(sessionData.Room.DisplayName.En)
			}
			event.DisplayName = &displayName
		} else if session.IsOnline != nil && *session.IsOnline {
			abbr := "ONLINE"
			event.DisplayAbbreviation = &abbr
			isOnline := true
			event.IsOnline = &isOnline
		}

		events = append(events, event)
	}

	return events
}

// buildRoomCalendarEvents converts sessions with therapist info to calendar events for room view
func buildRoomCalendarEvents(sessions []model.Session, getResourceId func(*model.Session) string, log *zap.Logger) []*calendarv1.CalendarEvent {
	events := make([]*calendarv1.CalendarEvent, 0, len(sessions))

	for _, sessionData := range sessions {
		session := sessionData
		startMs, endMs := sessionToCalendarStartEnd(&session, log)
		if startMs == 0 && endMs == 0 {
			continue
		}

		title := ""
		if session.DisplayName != nil && *session.DisplayName != "" {
			title = *session.DisplayName
		} else if session.Therapy != nil {
			title = session.Therapy.DisplayName
		}

		event := &calendarv1.CalendarEvent{
			Id:         session.Id,
			Title:      title,
			Start:      startMs,
			End:        endMs,
			ResourceId: getResourceId(&session),
		}

		if session.PaidAt != nil {
			paidAt := session.PaidAt.Int64()
			event.PaidAt = &paidAt
		}
		if session.PaymentType != nil {
			pt := calendarv1.SessionPaymentType(*session.PaymentType)
			event.PaymentType = &pt
		}
		if session.CancelledAt != nil {
			cancelledAt := session.CancelledAt.Int64()
			event.CancelledAt = &cancelledAt
		}
		if session.CancellationReason != nil {
			event.CancellationReason = session.CancellationReason
		}
		if session.RoomId != nil {
			event.RoomId = session.RoomId
		}

		// Add therapist display info for room calendar
		if util.Str(sessionData.Therapist.User.DisplayAbbreviation) != "" {
			event.DisplayAbbreviation = sessionData.Therapist.User.DisplayAbbreviation
		}
		if util.Str(sessionData.Therapist.DisplayColor) != "" {
			event.DisplayColor = sessionData.Therapist.DisplayColor
		}
		if sessionData.Therapist != nil && sessionData.Therapist.User != nil && sessionData.Therapist.User.DisplayName != nil {
			event.DisplayName = sessionData.Therapist.User.DisplayName
		}

		events = append(events, event)
	}

	return events
}

// buildOnlineCalendarEvents converts online sessions to calendar events assigned to the virtual "online" resource
func buildOnlineCalendarEvents(onlineSessions []model.Session, onlineResourceId string, log *zap.Logger) []*calendarv1.CalendarEvent {
	events := make([]*calendarv1.CalendarEvent, 0, len(onlineSessions))

	for _, sessionData := range onlineSessions {
		session := sessionData
		startMs, endMs := sessionToCalendarStartEnd(&session, log)
		if startMs == 0 && endMs == 0 {
			continue
		}

		title := ""
		if session.DisplayName != nil && *session.DisplayName != "" {
			title = *session.DisplayName
		} else if session.Therapy != nil {
			title = session.Therapy.DisplayName
		}

		isOnline := true
		event := &calendarv1.CalendarEvent{
			Id:         session.Id,
			Title:      title,
			Start:      startMs,
			End:        endMs,
			ResourceId: onlineResourceId,
			IsOnline:   &isOnline,
		}

		if session.PaidAt != nil {
			paidAt := session.PaidAt.Int64()
			event.PaidAt = &paidAt
		}
		if session.PaymentType != nil {
			pt := calendarv1.SessionPaymentType(*session.PaymentType)
			event.PaymentType = &pt
		}
		if session.CancelledAt != nil {
			cancelledAt := session.CancelledAt.Int64()
			event.CancelledAt = &cancelledAt
		}
		if session.CancellationReason != nil {
			event.CancellationReason = session.CancellationReason
		}

		// Add therapist display info for online sessions
		if sessionData.Therapist != nil && sessionData.Therapist.User != nil {
			if util.Str(sessionData.Therapist.User.DisplayAbbreviation) != "" {
				event.DisplayAbbreviation = sessionData.Therapist.User.DisplayAbbreviation
			}
			if util.Str(sessionData.Therapist.DisplayColor) != "" {
				event.DisplayColor = sessionData.Therapist.DisplayColor
			}
			if sessionData.Therapist.User.DisplayName != nil {
				event.DisplayName = sessionData.Therapist.User.DisplayName
			}
		}

		events = append(events, event)
	}

	return events
}

// buildWorkingHoursMap creates a map of working hours slots by therapist ID
func buildWorkingHoursMap(therapistIds []string, workingHours []model.WorkingHours) map[string][]*calendarv1.AvailabilitySlot {
	workingHoursMap := make(map[string][]*calendarv1.AvailabilitySlot)
	for _, therapistId := range therapistIds {
		workingHoursMap[therapistId] = []*calendarv1.AvailabilitySlot{}
	}

	for _, wh := range workingHours {
		slot := &calendarv1.AvailabilitySlot{
			Id:        wh.Id,
			DayOfWeek: int32(wh.DayOfWeek),
			FromTime:  wh.FromTime,
			TillTime:  wh.TillTime,
		}
		if _, exists := workingHoursMap[wh.TherapistId]; exists {
			workingHoursMap[wh.TherapistId] = append(workingHoursMap[wh.TherapistId], slot)
		}
	}

	return workingHoursMap
}

// buildAbsenceMap creates a map of absence slots by therapist ID
func buildAbsenceMap(therapistIds []string, absences []model.Absence) map[string][]*calendarv1.AbsenceSlot {
	absenceMap := make(map[string][]*calendarv1.AbsenceSlot)
	for _, therapistId := range therapistIds {
		absenceMap[therapistId] = []*calendarv1.AbsenceSlot{}
	}

	for _, absence := range absences {
		slot := &calendarv1.AbsenceSlot{
			Id:       absence.Id,
			FromTime: absence.FromTime.Int64(),
			TillTime: absence.TillTime.Int64(),
		}
		if absence.Reason != nil {
			slot.Reason = absence.Reason
		}

		if absence.TherapistId != nil {
			// Therapist-specific absence
			if _, exists := absenceMap[*absence.TherapistId]; exists {
				absenceMap[*absence.TherapistId] = append(absenceMap[*absence.TherapistId], slot)
			}
		} else {
			// Global absence: add to ALL therapists
			for therapistId := range absenceMap {
				absenceMap[therapistId] = append(absenceMap[therapistId], slot)
			}
		}
	}

	return absenceMap
}
