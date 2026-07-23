package calendar

import (
	calendarv1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"database/sql"
	"fmt"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

func (h *Service) UpdateEvent(ctx context.Context, req *connect.Request[calendarv1.UpdateEventRequest]) (*connect.Response[calendarv1.UpdateEventResponse], error) {
	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	eventId := req.Msg.EventId
	resourceType := req.Msg.ResourceType

	// Build the update based on what was provided
	session := &model.Session{
		Id: eventId,
	}

	columns := []string{}

	// Update time if provided — the calendar sends int64 Unix ms start/end.
	// We need to fetch the existing session's timezone to convert back to date + time strings.
	if req.Msg.Start != nil && req.Msg.End != nil {
		// Fetch existing session to get its timezone
		var existingSession model.Session
		err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().
				Model(&existingSession).
				Column("timezone").
				Where("id = ?", eventId).
				Scan(ctx)
		})
		if err != nil {
			h.log.Error("Failed to fetch session for timezone", zap.Error(err), zap.String("eventId", eventId))
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch session: %w", err))
		}

		tz := existingSession.Timezone
		if tz == "" {
			tz = "Europe/Warsaw"
		}

		startDate, startTime, err := model.UnixMsToDateTime(*req.Msg.Start, tz)
		if err != nil {
			h.log.Error("Failed to convert start time", zap.Error(err))
			return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("failed to convert start time: %w", err))
		}
		endDate, endTime, err := model.UnixMsToDateTime(*req.Msg.End, tz)
		if err != nil {
			h.log.Error("Failed to convert end time", zap.Error(err))
			return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("failed to convert end time: %w", err))
		}

		// Use start date as the session date (drag-drop should keep session within one day)
		_ = endDate
		session.Date = startDate
		session.StartTime = startTime
		session.EndTime = endTime
		columns = append(columns, "date", "start_time", "end_time")
	}

	// Update resource if provided
	if req.Msg.ResourceId != nil {
		if resourceType == "therapist" {
			session.TherapistId = *req.Msg.ResourceId
			columns = append(columns, "therapist_id")
		} else if resourceType == "room" {
			session.RoomId = req.Msg.ResourceId
			columns = append(columns, "room_id")
		}
	}

	if len(columns) == 0 {
		h.log.Error("No fields to update", zap.String("eventId", eventId))
		return nil, connect.NewError(connect.CodeInvalidArgument, nil)
	}

	var result sql.Result

	// Update the session
	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		r, err := tx.NewUpdate().
			Model(session).
			Column(columns...).
			Where("id = ?", eventId).
			Exec(ctx)
		result = r

		return err
	})

	if err != nil {
		h.log.Error("Failed to update event", zap.Error(err), zap.String("eventId", eventId))
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		h.log.Error("Failed to get rows affected", zap.Error(err))
		return nil, err
	}

	if rowsAffected == 0 {
		h.log.Error("Event not found", zap.String("eventId", eventId))
		return nil, connect.NewError(connect.CodeNotFound, nil)
	}

	return connect.NewResponse(&calendarv1.UpdateEventResponse{}), nil
}
