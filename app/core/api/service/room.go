package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"database/sql"
	"errors"
	"pkg/api"
	"pkg/repository"
	"pkg/tracing"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
)

type RoomService struct {
	api.AutocompleteMethod[model.Room]
	api.GetMethod[model.Room, corev1.Room]
	api.ListMethod[model.Room, corev1.ListRoomResponse]
	api.CreateMethod[model.Room, corev1.SaveRoomRequest, corev1.Room]
	api.UpdateMethod[model.Room, corev1.SaveRoomRequest, corev1.Room]
	api.SoftDeleteMethod[model.Room]
	api.DeleteMethod[model.Room]
	repository *repository.Repository[model.Room, corev1.Room, corev1.SaveRoomRequest]
}

func RoomServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.room")

	s := api.NewService[
		RoomService,
		model.Room,

		corev1.Room,
		corev1.ListRoomResponse,
		corev1.SaveRoomRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.repository = repository.NewRepository[model.Room, corev1.Room, corev1.SaveRoomRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewRoomServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

// FindAvailableRoom finds an available room for the given time slot.
// It returns the first room that has no overlapping sessions during the specified date and time range.
func (s *RoomService) FindAvailableRoom(ctx context.Context, req *connect.Request[corev1.FindAvailableRoomRequest]) (*connect.Response[corev1.FindAvailableRoomResponse], error) {
	date := req.Msg.Date
	startTime := req.Msg.StartTime
	endTime := req.Msg.EndTime

	var result struct {
		Id    string
		Label string
	}

	err := s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Table("core.room").
			ColumnExpr("room.id").
			ColumnExpr("room.display_name AS label").
			Where("room.deleted_at IS NULL").
			Where("NOT EXISTS (?)",
				tx.NewSelect().
					Table("core.session").
					Where("session.room_id = room.id").
					Where("session.deleted_at IS NULL").
					Where("session.cancelled_at IS NULL").
					Where("session.date = ?", date).
					Where("session.start_time < ?", endTime).
					Where("session.end_time > ?", startTime),
			).
			Limit(1).
			Scan(ctx, &result)
	})

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return connect.NewResponse(&corev1.FindAvailableRoomResponse{}), nil
		}
		return nil, err
	}

	return connect.NewResponse(&corev1.FindAvailableRoomResponse{
		RoomId:    &result.Id,
		RoomLabel: &result.Label,
	}), nil
}
