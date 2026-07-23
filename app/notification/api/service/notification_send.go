package service

import (
	"context"
	"errors"
	"fmt"

	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/gen/notification/v1/notificationv1connect"
	"app/notification/model"
	notificationservice "app/notification/service"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/str"
	"pkg/tracing"

	"connectrpc.com/connect"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type NotificationSendService struct {
	dao    notificationservice.NotificationDAO
	log    *zap.Logger
	tracer *tracing.Tracer
}

type NotificationSendServiceProps struct {
	fx.In

	ApiServer *api.Server
	DAO       notificationservice.NotificationDAO
	Log       *zap.Logger
}

func NotificationSendServiceProvider(props NotificationSendServiceProps) error {
	s := &NotificationSendService{
		dao:    props.DAO,
		log:    props.Log.Named("api.notification_send"),
		tracer: tracing.NewTracer("api.notification_send"),
	}

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := notificationv1connect.NewNotificationSendServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *NotificationSendService) Email(
	ctx context.Context,
	req *connect.Request[notificationv1.SendEmailRequest],
) (*connect.Response[notificationv1.SendEmailResponse], error) {
	ctx, span, _ := s.tracer.Start(ctx, "queueEmail")
	defer span.End()

	if err := api.Validator.Validate(req.Msg); err != nil {
		return nil, api.ValidationErrorHandler(err)
	}

	requestedBy := requestedByFromCtx(ctx)
	row, _, err := s.dao.UpsertNotification(ctx, notificationservice.NotificationUpsertModel{
		RecipientUserID: str.TrimPtrToNil(req.Msg.RecipientUserId),
		RecipientLabel:  req.Msg.RecipientLabel,
		RecipientEmail:  &req.Msg.ToAddress,
		Subject:         &req.Msg.Subject,
		Body:            req.Msg.Body,
		Mechanism:       notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL,
		IdempotencyKey:  str.TrimPtrToNil(req.Msg.IdempotencyKey),
		ScheduledAt:     req.Msg.ScheduledAt,
		RequestedBy:     requestedBy,
	})
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&notificationv1.SendEmailResponse{NotificationId: row.Id}), nil
}

func (s *NotificationSendService) SMS(
	ctx context.Context,
	req *connect.Request[notificationv1.SendSMSRequest],
) (*connect.Response[notificationv1.SendSMSResponse], error) {
	ctx, span, _ := s.tracer.Start(ctx, "queueSMS")
	defer span.End()

	if err := api.Validator.Validate(req.Msg); err != nil {
		return nil, api.ValidationErrorHandler(err)
	}

	requestedBy := requestedByFromCtx(ctx)
	row, _, err := s.dao.UpsertNotification(ctx, notificationservice.NotificationUpsertModel{
		RecipientUserID: str.TrimPtrToNil(req.Msg.RecipientUserId),
		RecipientLabel:  req.Msg.RecipientLabel,
		RecipientPhone:  &req.Msg.ToPhone,
		Body:            req.Msg.Body,
		Mechanism:       notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS,
		IdempotencyKey:  str.TrimPtrToNil(req.Msg.IdempotencyKey),
		ScheduledAt:     req.Msg.ScheduledAt,
		RequestedBy:     requestedBy,
	})
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&notificationv1.SendSMSResponse{NotificationId: row.Id}), nil
}

func (s *NotificationSendService) Send(
	ctx context.Context,
	req *connect.Request[notificationv1.SendNotificationRequest],
) (*connect.Response[notificationv1.Notification], error) {
	ctx, span, _ := s.tracer.Start(ctx, "queueNotification")
	defer span.End()

	if err := api.Validator.Validate(req.Msg); err != nil {
		return nil, api.ValidationErrorHandler(err)
	}

	upsert := notificationservice.NotificationUpsertModel{
		RecipientUserID: str.TrimPtrToNil(req.Msg.RecipientUserId),
		RecipientLabel:  req.Msg.RecipientLabel,
		Body:            req.Msg.Body,
		Mechanism:       req.Msg.DeliveryMechanism,
		IdempotencyKey:  str.TrimPtrToNil(req.Msg.IdempotencyKey),
		ScheduledAt:     req.Msg.ScheduledAt,
		RequestedBy:     requestedByFromCtx(ctx),
	}

	switch req.Msg.DeliveryMechanism {
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL:
		if str.TrimPtrToNil(req.Msg.ToAddress) == nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("toAddress is required for email"))
		}
		if str.TrimPtrToNil(req.Msg.Subject) == nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("subject is required for email"))
		}
		upsert.RecipientEmail = req.Msg.ToAddress
		upsert.Subject = req.Msg.Subject
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS:
		if str.TrimPtrToNil(req.Msg.ToPhone) == nil {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("toPhone is required for sms"))
		}
		upsert.RecipientPhone = req.Msg.ToPhone
	default:
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("unsupported deliveryMechanism %d", req.Msg.DeliveryMechanism))
	}

	row, _, err := s.dao.UpsertNotification(ctx, upsert)
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(notificationToProto(row)), nil
}

func notificationToProto(row *model.Notification) *notificationv1.Notification {
	if row == nil {
		return nil
	}
	resp := &notificationv1.Notification{
		Id:                row.Id,
		RecipientUserId:   row.RecipientUserId,
		RecipientLabel:    row.RecipientLabel,
		RecipientEmail:    row.RecipientEmail,
		RecipientPhone:    row.RecipientPhone,
		DeliveryMechanism: row.DeliveryMechanism,
		Status:            row.Status,
		Subject:           row.Subject,
		Body:              row.Body,
		ErrorMessage:      row.ErrorMessage,
		AttemptCount:      int32(row.AttemptCount),
		CreatedAt:         row.CreatedAt.TimestampToInt64(),
		CreatedBy:         row.CreatedBy,
	}
	if row.SentAt != nil {
		v := row.SentAt.TimestampToInt64()
		resp.SentAt = &v
	}
	if row.UpdatedAt != nil {
		v := row.UpdatedAt.TimestampToInt64()
		resp.UpdatedAt = &v
	}
	resp.UpdatedBy = row.UpdatedBy
	if row.DeletedAt != nil {
		v := row.DeletedAt.TimestampToInt64()
		resp.DeletedAt = &v
	}
	resp.DeletedBy = row.DeletedBy
	return resp
}

func requestedByFromCtx(ctx context.Context) string {
	requestedBy, _ := ctxHelpers.GetContextUserID(ctx)
	if requestedBy == "" {
		return "system"
	}
	return requestedBy
}
