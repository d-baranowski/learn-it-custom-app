package calendar

import (
	calendarv1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"pkg/ctxHelpers"
	"pkg/unix"
	"pkg/util"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func (h *Service) GetTherapistCalendarEvents(ctx context.Context, req *connect.Request[calendarv1.GetTherapistCalendarEventsRequest]) (*connect.Response[calendarv1.GetTherapistCalendarEventsResponse], error) {
	ctx, span, _ := h.tracer.Start(ctx, "GetTherapistCalendarEvents")
	defer span.End()

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	startDate := unix.Int64ToTimestamp(req.Msg.StartDate)
	endDate := unix.Int64ToTimestamp(req.Msg.EndDate)
	filterTherapistIds := req.Msg.TherapistIds
	filterServiceIds := req.Msg.ServiceIds
	// Get language from context for translated fields
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	// Query all therapists or filter by provided IDs
	var therapists []struct {
		Id                  string
		DisplayName         string
		DisplayAbbreviation string
		DisplayColor        string
	}

	therapistsCtx, therapistsSpan, _ := h.tracer.Start(ctx, "fetchTherapists")
	err := h.repository.Run(therapistsCtx, func(ctx context.Context, tx bun.Tx) error {
		therapistQuery := tx.NewSelect().
			TableExpr("core.therapist as therapist").
			ColumnExpr("therapist.id as id").
			ColumnExpr("COALESCE(u.display_name, '') as display_name").
			ColumnExpr("COALESCE(u.display_abbreviation, '') as display_abbreviation").
			ColumnExpr("COALESCE(therapist.display_color, '') as display_color").
			Order("u.display_name ASC").
			Join("LEFT JOIN core.user u ON u.id = therapist.user_id").
			Where("therapist.deleted_at IS NULL")

		if len(filterTherapistIds) > 0 {
			therapistQuery = therapistQuery.Where("therapist.id IN (?)", bun.In(filterTherapistIds))
		}

		err := therapistQuery.Scan(ctx, &therapists)
		if err != nil {
			h.log.Error("Failed to query therapists", zap.Error(err))
			return err
		}

		return nil
	})
	therapistsSpan.End()

	if err != nil {
		return nil, err
	}

	// Build therapist IDs list and name map
	therapistIds := make([]string, 0, len(therapists))
	therapistNameMap := make(map[string]string)
	therapistAbbreviationMap := make(map[string]string)
	therapistColorMap := make(map[string]string)
	for _, t := range therapists {
		therapistIds = append(therapistIds, t.Id)
		therapistNameMap[t.Id] = t.DisplayName
		therapistAbbreviationMap[t.Id] = t.DisplayAbbreviation
		therapistColorMap[t.Id] = t.DisplayColor
	}

	// Query sessions using helper
	sessionsCtx, sessionsSpan, _ := h.tracer.Start(ctx, "fetchSessions")
	sessions, err := h.querySessionsByTherapistIdsAndServiceIds(sessionsCtx, startDate, endDate, filterTherapistIds, filterServiceIds)
	sessionsSpan.End()
	if err != nil {
		return nil, err
	}

	// Build events using helper
	events := buildTherapistCalendarEvents(sessions, func(s *model.Session) string {
		return s.TherapistId
	}, lang, h.log)

	// Query working hours slots for therapists
	var workingHours []model.WorkingHours
	if len(therapistIds) > 0 {
		whCtx, whSpan, _ := h.tracer.Start(ctx, "fetchWorkingHours")
		err = h.repository.Run(whCtx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().
				Model(&workingHours).
				Where("therapist_id IN (?)", bun.In(therapistIds)).
				Where("deleted_at IS NULL").
				Scan(ctx)
		})
		whSpan.End()
		if err != nil {
			h.log.Error("Failed to query working hours", zap.Error(err))
			return nil, err
		}
	}

	// Query absence slots for therapists (including global absences where therapist_id IS NULL)
	var absences []model.Absence
	absCtx, absSpan, _ := h.tracer.Start(ctx, "fetchAbsences")
	err = h.repository.Run(absCtx, func(ctx context.Context, tx bun.Tx) error {
		absenceQuery := tx.NewSelect().
			Model(&absences).
			Where("from_time <= ?", endDate).
			Where("till_time >= ?", startDate).
			Where("deleted_at IS NULL")

		// Filter by therapist IDs if provided, but always include global absences (therapist_id IS NULL)
		if len(filterTherapistIds) > 0 {
			absenceQuery = absenceQuery.Where("(therapist_id IN (?) OR therapist_id IS NULL)", bun.In(filterTherapistIds))
		}

		return absenceQuery.Scan(ctx)
	})
	absSpan.End()
	if err != nil {
		h.log.Error("Failed to query absences", zap.Error(err))
		return nil, err
	}

	// Build working hours and absence maps using helpers
	workingHoursMap := buildWorkingHoursMap(therapistIds, workingHours)
	absenceMap := buildAbsenceMap(therapistIds, absences)

	// Build resource map for all therapists
	resourceMap := make([]*calendarv1.ResourceMap, 0, len(therapistIds))
	for _, therapistId := range therapistIds {
		resource := &calendarv1.ResourceMap{
			ResourceId:          therapistId,
			ResourceTitle:       therapistNameMap[therapistId],
			AvailabilitySlots:   workingHoursMap[therapistId],
			AbsenceSlots:        absenceMap[therapistId],
			DisplayAbbreviation: util.ToPtr(therapistAbbreviationMap[therapistId]),
			DisplayColor:        util.ToPtr(therapistColorMap[therapistId]),
		}
		resourceMap = append(resourceMap, resource)
	}

	return connect.NewResponse(&calendarv1.GetTherapistCalendarEventsResponse{
		Events:      events,
		ResourceMap: resourceMap,
	}), nil
}
