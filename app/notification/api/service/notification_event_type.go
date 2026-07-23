package service

import (
	"context"

	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/gen/notification/v1/notificationv1connect"
	eventtypes "app/notification/event_types"
	"pkg/api"
	"pkg/tracing"

	"connectrpc.com/connect"
	requestv1 "pkg/request/gen/request/v1"
)

type NotificationEventTypeService struct {
	tracer *tracing.Tracer
}

func NotificationEventTypeServiceProvider(props ApiServiceProps) error {
	s := &NotificationEventTypeService{
		tracer: tracing.NewTracer("api.notification_event_type"),
	}

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := notificationv1connect.NewNotificationEventTypeServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *NotificationEventTypeService) Autocomplete(ctx context.Context, _ *connect.Request[requestv1.AutocompleteRequest]) (*connect.Response[requestv1.AutocompleteResponse], error) {
	specs := eventtypes.LatestEventTypeSpecs()

	items := make([]*requestv1.AutocompleteItem, 0, len(specs))
	for _, spec := range specs {
		items = append(items, &requestv1.AutocompleteItem{
			ID:    eventtypes.EventTypeSpecID(spec.Key, spec.Version),
			Label: spec.DisplayName,
		})
	}

	return connect.NewResponse(&requestv1.AutocompleteResponse{Items: items}), nil
}

func (s *NotificationEventTypeService) Get(ctx context.Context, req *connect.Request[requestv1.GetRequest]) (*connect.Response[notificationv1.NotificationEventType], error) {
	spec, ok := eventtypes.EventTypeSpecByID(req.Msg.ID)
	if !ok {
		return nil, connect.NewError(connect.CodeNotFound, nil)
	}

	fields := make([]*notificationv1.NotificationPayloadField, len(spec.PayloadFields))
	for i, f := range spec.PayloadFields {
		fields[i] = &notificationv1.NotificationPayloadField{
			Path:     f.Path,
			Type:     notificationv1.NotificationPayloadFieldType(f.Type),
			Required: f.Required,
		}
		if f.Description != nil {
			fields[i].Description = f.Description
		}
	}

	return connect.NewResponse(&notificationv1.NotificationEventType{
		Id:            eventtypes.EventTypeSpecID(spec.Key, spec.Version),
		Key:           spec.Key,
		DisplayName:   spec.DisplayName,
		Description:   spec.Description,
		PayloadFields: fields,
		Version:       int32(spec.Version),
	}), nil
}
