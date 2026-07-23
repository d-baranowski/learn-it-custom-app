package service

import (
	"context"

	eventtypes "app/notification/event_types"
)

func listLatestNotificationEventTypes(_ context.Context) []eventtypes.EventTypeSpec {
	return eventtypes.LatestEventTypeSpecs()
}
