package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"context"
	"errors"
	"fmt"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/tracing"
	"pkg/unix"
	"sort"
	"time"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type WorkingHoursService struct {
	Tracer     *tracing.Tracer
	repository *repository.Repository[model.WorkingHours, corev1.WorkingHours, corev1.SaveWorkingHoursRequest]
	log        *zap.Logger

	api.AutocompleteMethod[model.WorkingHours]
	api.GetMethod[model.WorkingHours, corev1.WorkingHours]
	api.ListMethod[model.WorkingHours, corev1.ListWorkingHoursResponse]
	api.CreateMethod[model.WorkingHours, corev1.SaveWorkingHoursRequest, corev1.WorkingHours]
	api.UpdateMethod[model.WorkingHours, corev1.SaveWorkingHoursRequest, corev1.WorkingHours]
	api.SoftDeleteMethod[model.WorkingHours]
	api.DeleteMethod[model.WorkingHours]
}

type normalizedWorkingHoursSlot struct {
	dayOfWeek   corev1.DayOfWeek
	fromTime    string
	tillTime    string
	fromMinutes int
	tillMinutes int
}

func WorkingHoursServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.working_hours")

	s := api.NewService[
		WorkingHoursService,
		model.WorkingHours,

		corev1.WorkingHours,
		corev1.ListWorkingHoursResponse,
		corev1.SaveWorkingHoursRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)
	s.Tracer = tracer
	s.log = props.Log
	s.repository = repository.NewRepository[model.WorkingHours, corev1.WorkingHours, corev1.SaveWorkingHoursRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewWorkingHoursServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *WorkingHoursService) ReplaceTherapistWeek(ctx context.Context, req *connect.Request[corev1.ReplaceTherapistWeekRequest]) (*connect.Response[corev1.ReplaceTherapistWeekResponse], error) {
	spanCtx, span, log := s.Tracer.Start(ctx, "replaceTherapistWeek")
	defer span.End()

	spanCtx = ctxHelpers.SetApiContext(spanCtx)

	if err := api.Validator.Validate(req.Msg); err != nil {
		log.Debug("validation error", zap.Error(err))
		span.RecordError(err)
		return nil, api.ValidationErrorHandler(err)
	}

	normalizedSlots, err := normalizeWorkingHoursSlots(req.Msg.Slots)
	if err != nil {
		log.Debug("invalid working hours week", zap.Error(err))
		span.RecordError(err)
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	userID, _ := ctxHelpers.GetContextUserID(spanCtx)
	now := unix.Now()
	savedRows := make([]model.WorkingHours, 0, len(normalizedSlots))

	err = s.repository.Run(spanCtx, func(ctx context.Context, tx bun.Tx) error {
		therapistCount, err := tx.NewSelect().
			TableExpr("core.therapist").
			Where("id = ?", req.Msg.TherapistId).
			Where("deleted_at IS NULL").
			Count(ctx)
		if err != nil {
			return err
		}
		if therapistCount == 0 {
			return connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("therapist not found"))
		}

		if _, err := tx.NewDelete().
			TableExpr("core.working_hours").
			Where("therapist_id = ?", req.Msg.TherapistId).
			Exec(ctx); err != nil {
			return err
		}

		for _, slot := range normalizedSlots {
			row := &model.WorkingHours{
				TherapistId: req.Msg.TherapistId,
				DayOfWeek:   int(slot.dayOfWeek),
				FromTime:    slot.fromTime,
				TillTime:    slot.tillTime,
				CreatedAt:   now,
				CreatedBy:   userID,
			}

			if err := tx.NewInsert().Model(row).Returning("*").Scan(ctx, row); err != nil {
				return err
			}
		}

		return tx.NewSelect().
			Model(&savedRows).
			Where("therapist_id = ?", req.Msg.TherapistId).
			Where("deleted_at IS NULL").
			OrderExpr("day_of_week ASC, from_time ASC").
			Scan(ctx)
	})
	if err != nil {
		log.Error("failed to replace therapist week", zap.String("therapistId", req.Msg.TherapistId), zap.Error(err))
		span.RecordError(err)
		var connectErr *connect.Error
		if errors.As(err, &connectErr) {
			return nil, connectErr
		}
		return nil, api.CommonApiErrorHandler(err)
	}

	items := make([]*corev1.WorkingHours, 0, len(savedRows))
	for i := range savedRows {
		items = append(items, workingHoursToProto(&savedRows[i]))
	}

	return connect.NewResponse(&corev1.ReplaceTherapistWeekResponse{
		Items: items,
	}), nil
}

func normalizeWorkingHoursSlots(slots []*corev1.WorkingHoursWeekSlot) ([]normalizedWorkingHoursSlot, error) {
	normalized := make([]normalizedWorkingHoursSlot, 0, len(slots))
	for i, slot := range slots {
		fromTime, fromMinutes, err := parseWorkingHoursClock(slot.FromTime)
		if err != nil {
			return nil, fmt.Errorf("slot %d: %w", i+1, err)
		}
		tillTime, tillMinutes, err := parseWorkingHoursClock(slot.TillTime)
		if err != nil {
			return nil, fmt.Errorf("slot %d: %w", i+1, err)
		}
		if tillMinutes <= fromMinutes {
			return nil, fmt.Errorf("slot %d: till time must be after from time", i+1)
		}

		normalized = append(normalized, normalizedWorkingHoursSlot{
			dayOfWeek:   slot.DayOfWeek,
			fromTime:    fromTime,
			tillTime:    tillTime,
			fromMinutes: fromMinutes,
			tillMinutes: tillMinutes,
		})
	}

	sort.Slice(normalized, func(i, j int) bool {
		if normalized[i].dayOfWeek != normalized[j].dayOfWeek {
			return normalized[i].dayOfWeek < normalized[j].dayOfWeek
		}
		if normalized[i].fromMinutes != normalized[j].fromMinutes {
			return normalized[i].fromMinutes < normalized[j].fromMinutes
		}
		return normalized[i].tillMinutes < normalized[j].tillMinutes
	})

	for i := 1; i < len(normalized); i++ {
		prev := normalized[i-1]
		curr := normalized[i]
		if prev.dayOfWeek != curr.dayOfWeek {
			continue
		}
		if prev.fromMinutes == curr.fromMinutes && prev.tillMinutes == curr.tillMinutes {
			return nil, fmt.Errorf("duplicate slot for day %d at %s-%s", curr.dayOfWeek, curr.fromTime, curr.tillTime)
		}
		if curr.fromMinutes < prev.tillMinutes {
			return nil, fmt.Errorf("overlapping slots for day %d", curr.dayOfWeek)
		}
	}

	return normalized, nil
}

func parseWorkingHoursClock(value string) (string, int, error) {
	for _, layout := range []string{"15:04:05", "15:04"} {
		parsed, err := time.Parse(layout, value)
		if err == nil {
			return parsed.Format("15:04:05"), parsed.Hour()*60 + parsed.Minute(), nil
		}
	}

	return "", 0, fmt.Errorf("invalid time %q, expected HH:MM or HH:MM:SS", value)
}

func workingHoursToProto(row *model.WorkingHours) *corev1.WorkingHours {
	return &corev1.WorkingHours{
		Id:                        row.Id,
		TherapistId:               row.TherapistId,
		TherapistLabel:            toOptionalString(row.TherapistLabel),
		TherapistAbbreviationLabel: row.TherapistAbbreviationLabel,
		DayOfWeek:                 corev1.DayOfWeek(row.DayOfWeek),
		FromTime:                  row.FromTime,
		TillTime:                  row.TillTime,
		CreatedAt:                 row.CreatedAt.Int64(),
		CreatedBy:                 row.CreatedBy,
		CreatedByLabel:            toOptionalString(row.CreatedByLabel),
		UpdatedAt:                 timestampToInt64Ptr(row.UpdatedAt),
		UpdatedBy:                 row.UpdatedBy,
		UpdatedByLabel:            row.UpdatedByLabel,
		DeletedAt:                 timestampToInt64Ptr(row.DeletedAt),
		DeletedBy:                 row.DeletedBy,
		DeletedByLabel:            row.DeletedByLabel,
	}
}

func timestampToInt64Ptr(ts *unix.Timestamp) *int64 {
	if ts == nil {
		return nil
	}
	value := ts.Int64()
	return &value
}

func toOptionalString(value string) *string {
	if value == "" {
		return nil
	}
	valueCopy := value
	return &valueCopy
}
