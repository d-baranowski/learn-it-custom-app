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

// onlineResourceId is the virtual resource ID used for online sessions in the room calendar.
const onlineResourceId = "online"

func (h *Service) GetRoomCalendarEvents(ctx context.Context, req *connect.Request[calendarv1.GetRoomCalendarEventsRequest]) (*connect.Response[calendarv1.GetRoomCalendarEventsResponse], error) {
	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	startDate := unix.Int64ToTimestamp(req.Msg.StartDate)
	endDate := unix.Int64ToTimestamp(req.Msg.EndDate)
	filterRoomIds := req.Msg.RoomIds

	// Get language from context for translated fields
	lang := ctxHelpers.GetLanguageFromContext(ctx)

	// Query all rooms or filter by provided IDs
	var rooms []struct {
		Id                  string
		DisplayName         string
		DisplayAbbreviation string
		DisplayColor        string
	}
	err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		roomQuery := tx.NewSelect().
			Table("core.room").
			ColumnExpr("room.id as id").
			ColumnExpr("room.display_name->>'" + lang + "' as display_name").
			ColumnExpr("COALESCE(room.display_abbreviation, '') as display_abbreviation").
			ColumnExpr("COALESCE(room.display_color, '') as display_color").
			Where("room.deleted_at IS NULL")

		if len(filterRoomIds) > 0 {
			roomQuery = roomQuery.Where("room.id IN (?)", bun.In(filterRoomIds))
		}

		return roomQuery.Scan(ctx, &rooms)
	})
	if err != nil {
		h.log.Error("Failed to query rooms", zap.Error(err))
		return nil, err
	}

	// Build room IDs list and name map
	roomIds := make([]string, 0, len(rooms))
	roomNameMap := make(map[string]string)
	roomAbbreviationMap := make(map[string]string)
	roomColorMap := make(map[string]string)
	for _, r := range rooms {
		roomIds = append(roomIds, r.Id)
		roomNameMap[r.Id] = r.DisplayName
		roomAbbreviationMap[r.Id] = r.DisplayAbbreviation
		roomColorMap[r.Id] = r.DisplayColor
	}

	// Query sessions using helper
	sessions, err := h.querySessionsByRoomIds(ctx, startDate, endDate, filterRoomIds)
	if err != nil {
		return nil, err
	}

	// Build events using helper - for rooms, use room_id as resource
	events := buildRoomCalendarEvents(sessions, func(s *model.Session) string {
		if s.RoomId != nil {
			return *s.RoomId
		}
		return ""
	}, h.log)

	// Query online sessions (always included regardless of room filter, since online sessions have no room)
	onlineSessions, err := h.queryOnlineSessions(ctx, startDate, endDate)
	if err != nil {
		h.log.Error("Failed to query online sessions", zap.Error(err))
		return nil, err
	}
	onlineEvents := buildOnlineCalendarEvents(onlineSessions, onlineResourceId, h.log)
	events = append(events, onlineEvents...)

	// Build resource map for all rooms (no availability/absence for rooms)
	resourceMap := make([]*calendarv1.RoomResourceMap, 0, len(roomIds)+1)
	for _, roomId := range roomIds {
		resource := &calendarv1.RoomResourceMap{
			ResourceId:          roomId,
			ResourceTitle:       roomNameMap[roomId],
			DisplayAbbreviation: util.ToPtr(roomAbbreviationMap[roomId]),
			DisplayColor:        util.ToPtr(roomColorMap[roomId]),
		}
		resourceMap = append(resourceMap, resource)
	}

	// Append the virtual "Online" resource so it always appears as a column
	onlineTitle := "Online"
	resourceMap = append(resourceMap, &calendarv1.RoomResourceMap{
		ResourceId:    onlineResourceId,
		ResourceTitle: onlineTitle,
	})

	return connect.NewResponse(&calendarv1.GetRoomCalendarEventsResponse{
		Events:      events,
		ResourceMap: resourceMap,
	}), nil
}
