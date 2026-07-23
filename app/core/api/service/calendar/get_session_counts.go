package calendar

import (
	calendarv1 "app/core/gen/core/v1"
	"context"
	"pkg/unix"

	"connectrpc.com/connect"
)

func (h *Service) GetTherapistSessionCounts(ctx context.Context, req *connect.Request[calendarv1.GetTherapistSessionCountsRequest]) (*connect.Response[calendarv1.GetSessionCountsResponse], error) {
	ctx, span, _ := h.tracer.Start(ctx, "GetTherapistSessionCounts")
	defer span.End()

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	startDate := unix.Int64ToTimestamp(req.Msg.StartDate)
	endDate := unix.Int64ToTimestamp(req.Msg.EndDate)

	counts, err := h.countSessionsByTherapistIdsAndServiceIds(ctx, startDate, endDate, req.Msg.TherapistIds, req.Msg.ServiceIds)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&calendarv1.GetSessionCountsResponse{
		Counts: toProtoSessionCounts(counts),
	}), nil
}

func (h *Service) GetRoomSessionCounts(ctx context.Context, req *connect.Request[calendarv1.GetRoomSessionCountsRequest]) (*connect.Response[calendarv1.GetSessionCountsResponse], error) {
	ctx, span, _ := h.tracer.Start(ctx, "GetRoomSessionCounts")
	defer span.End()

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	startDate := unix.Int64ToTimestamp(req.Msg.StartDate)
	endDate := unix.Int64ToTimestamp(req.Msg.EndDate)

	counts, err := h.countSessionsByRoomIds(ctx, startDate, endDate, req.Msg.RoomIds)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&calendarv1.GetSessionCountsResponse{
		Counts: toProtoSessionCounts(counts),
	}), nil
}

func toProtoSessionCounts(counts []sessionDayCount) []*calendarv1.SessionDayCount {
	result := make([]*calendarv1.SessionDayCount, 0, len(counts))
	for _, c := range counts {
		result = append(result, &calendarv1.SessionDayCount{
			Date:  c.Date,
			Count: c.Count,
		})
	}
	return result
}
