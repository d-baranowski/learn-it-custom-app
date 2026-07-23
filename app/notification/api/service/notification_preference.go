package service

import (
	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/gen/notification/v1/notificationv1connect"
	"app/notification/model"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"pkg/api"
	"pkg/ctxHelpers"
	"pkg/tracing"
	"pkg/unix"
	"sort"
	"strings"

	"connectrpc.com/connect"
	"github.com/segmentio/ksuid"
	"github.com/uptrace/bun"
	"google.golang.org/protobuf/types/known/emptypb"
)

type NotificationPreferenceService struct {
	db     *bun.DB
	tracer *tracing.Tracer
}

type preferenceSnapshotUser struct {
	DisplayName *string `bun:"display_name"`
	Email       *string `bun:"email"`
}

type mergedNotificationPreference struct {
	EventTypeKey         string
	EventTypeLabel       string
	EventTypeDescription *string
	DeliveryMechanisms   []notificationv1.NotificationDeliveryMechanism
	LanguageCode         string
}

var supportedPreferenceDeliveryMechanisms = []notificationv1.NotificationDeliveryMechanism{
	notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL,
	notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS,
}

func NotificationPreferenceServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.notification_preference")
	s := &NotificationPreferenceService{
		db:     props.DB,
		tracer: tracer,
	}

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := notificationv1connect.NewNotificationPreferenceServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func (s *NotificationPreferenceService) ListMyNotificationPreferences(
	ctx context.Context,
	_ *connect.Request[emptypb.Empty],
) (*connect.Response[notificationv1.ListMyNotificationPreferencesResponse], error) {
	_, span, _ := s.tracer.Start(ctx, "listMyNotificationPreferences")
	defer span.End()

	currentUserID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok || currentUserID == "" {
		return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("current user was not found in context"))
	}

	userSnapshot, err := loadPreferenceSnapshotUser(ctx, s.db, currentUserID)
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	mergedRows, languageCode, phoneNumber, email, err := s.loadMergedPreferences(ctx, s.db, currentUserID, userSnapshot)
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	items := make([]*notificationv1.MyNotificationPreference, 0, len(mergedRows))
	for _, row := range mergedRows {
		items = append(items, &notificationv1.MyNotificationPreference{
			EventTypeKey:         row.EventTypeKey,
			EventTypeLabel:       row.EventTypeLabel,
			EventTypeDescription: row.EventTypeDescription,
			DeliveryMechanisms:   row.DeliveryMechanisms,
		})
	}

	return connect.NewResponse(&notificationv1.ListMyNotificationPreferencesResponse{
		LanguageCode: languageCode,
		Items:        items,
		PhoneNumber:  phoneNumber,
		Email:        email,
	}), nil
}

func (s *NotificationPreferenceService) SaveMyNotificationPreferences(
	ctx context.Context,
	req *connect.Request[notificationv1.SaveMyNotificationPreferencesRequest],
) (*connect.Response[notificationv1.SaveMyNotificationPreferencesResponse], error) {
	_, span, _ := s.tracer.Start(ctx, "saveMyNotificationPreferences")
	defer span.End()

	if err := api.Validator.Validate(req.Msg); err != nil {
		return nil, api.ValidationErrorHandler(err)
	}

	currentUserID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok || currentUserID == "" {
		return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("current user was not found in context"))
	}

	languageCode := strings.TrimSpace(req.Msg.LanguageCode)
	if languageCode == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("languageCode is required"))
	}
	phoneNumber := normalizePreferenceOptionalPhone(req.Msg.PhoneNumber)

	itemsByEventType, err := normalizeSaveItems(req.Msg.Items)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}

	requestEmail := normalizePreferenceOptionalEmail(req.Msg.Email)
	hasEmailNotifications := hasDeliveryMechanismInItems(
		itemsByEventType,
		notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL,
	)
	responseEmail := requestEmail

	err = s.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		userSnapshot, err := loadPreferenceSnapshotUser(ctx, tx, currentUserID)
		if err != nil {
			return err
		}

		eventTypes, err := loadEnabledEventTypesByKey(ctx, tx)
		if err != nil {
			return err
		}

		effectiveEmail := requestEmail
		if effectiveEmail == nil {
			effectiveEmail = normalizePreferenceOptionalEmail(userSnapshot.Email)
		}
		if hasEmailNotifications && effectiveEmail == nil {
			return connect.NewError(connect.CodeInvalidArgument, errors.New("email is required when email notifications are enabled"))
		}
		responseEmail = effectiveEmail

		now := unix.Now()
		rows := make([]*model.Preference, 0, len(itemsByEventType)*len(supportedPreferenceDeliveryMechanisms))
		for eventTypeKey, enabledMechanisms := range itemsByEventType {
			if _, exists := eventTypes[eventTypeKey]; !exists {
				return connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("notification event type %q is not enabled", eventTypeKey))
			}

			for _, mechanism := range supportedPreferenceDeliveryMechanisms {
				_, isEnabled := enabledMechanisms[mechanism]
				rows = append(rows, &model.Preference{
					Id:                ksuid.New().String(),
					UserId:            currentUserID,
					UserLabel:         normalizePreferenceOptionalString(userSnapshot.DisplayName),
					UserEmail:         effectiveEmail,
					UserPhone:         phoneNumber,
					EventTypeKey:      eventTypeKey,
					LanguageCode:      languageCode,
					DeliveryMechanism: int(mechanism),
					IsEnabled:         isEnabled,
					CreatedAt:         now,
					CreatedBy:         currentUserID,
					UpdatedAt:         &now,
					UpdatedBy:         &currentUserID,
				})
			}
		}

		if len(rows) == 0 {
			return nil
		}

		_, err = tx.NewInsert().
			Model(&rows).
			On(`CONFLICT (user_id, event_type_key, delivery_mechanism) WHERE deleted_at IS NULL DO UPDATE`).
			Set("user_label = EXCLUDED.user_label").
			Set("user_email = EXCLUDED.user_email").
			Set("user_phone = EXCLUDED.user_phone").
			Set("language = EXCLUDED.language").
			Set("enabled = EXCLUDED.enabled").
			Set("updated_at = EXCLUDED.updated_at").
			Set("updated_by = EXCLUDED.updated_by").
			Set("deleted_at = NULL").
			Set("deleted_by = NULL").
			Exec(ctx)

		return err
	})
	if err != nil {
		return nil, api.CommonApiErrorHandler(err)
	}

	return connect.NewResponse(&notificationv1.SaveMyNotificationPreferencesResponse{
		LanguageCode: languageCode,
		PhoneNumber:  phoneNumber,
		Email:        responseEmail,
	}), nil
}

func (s *NotificationPreferenceService) loadMergedPreferences(
	ctx context.Context,
	db bun.IDB,
	currentUserID string,
	userSnapshot *preferenceSnapshotUser,
) ([]mergedNotificationPreference, string, *string, *string, error) {
	eventTypes := listLatestNotificationEventTypes(ctx)

	var preferences []model.Preference
	if err := db.NewSelect().
		Model(&preferences).
		Where("user_id = ?", currentUserID).
		Where("deleted_at IS NULL").
		OrderExpr("created_at ASC").
		Scan(ctx); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, "", nil, nil, err
	}

	preferenceRowsByEventType := make(map[string][]model.Preference, len(preferences))
	languageCode := derivePreferenceLanguageCode(preferences)
	phoneNumber := derivePreferencePhoneNumber(preferences)
	email := derivePreferenceEmail(preferences, userSnapshot)
	for _, preference := range preferences {
		preferenceRowsByEventType[preference.EventTypeKey] = append(preferenceRowsByEventType[preference.EventTypeKey], preference)
	}

	rows := make([]mergedNotificationPreference, 0, len(eventTypes))
	for _, eventType := range eventTypes {
		merged := mergedNotificationPreference{
			EventTypeKey:         eventType.Key,
			EventTypeLabel:       eventType.DisplayName,
			EventTypeDescription: eventType.Description,
			DeliveryMechanisms:   []notificationv1.NotificationDeliveryMechanism{},
			LanguageCode:         languageCode,
		}

		if rowGroup, exists := preferenceRowsByEventType[eventType.Key]; exists {
			for _, preference := range rowGroup {
				mechanism := denormalizeDeliveryMechanism(preference)
				if mechanism == notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_UNSPECIFIED {
					continue
				}
				merged.DeliveryMechanisms = append(merged.DeliveryMechanisms, mechanism)
				if trimmed := strings.TrimSpace(preference.LanguageCode); trimmed != "" {
					merged.LanguageCode = trimmed
				}
			}
		}

		merged.DeliveryMechanisms = normalizeMechanismList(merged.DeliveryMechanisms)
		rows = append(rows, merged)
	}

	return rows, languageCode, phoneNumber, email, nil
}

func loadPreferenceSnapshotUser(ctx context.Context, db bun.IDB, currentUserID string) (*preferenceSnapshotUser, error) {
	user := &preferenceSnapshotUser{}
	if err := db.NewSelect().
		TableExpr("core.user").
		Column("display_name", "email").
		Where("id = ?", currentUserID).
		Limit(1).
		Scan(ctx, user); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, connect.NewError(connect.CodeNotFound, errors.New("current user was not found"))
		}
		return nil, err
	}

	return user, nil
}

func loadEnabledEventTypesByKey(ctx context.Context, db bun.IDB) (map[string]struct{}, error) {
	eventTypes := listLatestNotificationEventTypes(ctx)

	result := make(map[string]struct{}, len(eventTypes))
	for _, eventType := range eventTypes {
		result[eventType.Key] = struct{}{}
	}

	return result, nil
}

const defaultPreferenceLanguageCode = "en"

func derivePreferenceLanguageCode(preferences []model.Preference) string {
	for _, preference := range preferences {
		if !preference.IsEnabled {
			continue
		}

		if trimmed := strings.TrimSpace(preference.LanguageCode); trimmed != "" {
			return trimmed
		}
	}

	for _, preference := range preferences {
		if trimmed := strings.TrimSpace(preference.LanguageCode); trimmed != "" {
			return trimmed
		}
	}

	return defaultPreferenceLanguageCode
}

func normalizeSaveItems(items []*notificationv1.SaveMyNotificationPreferenceItem) (map[string]map[notificationv1.NotificationDeliveryMechanism]struct{}, error) {
	result := make(map[string]map[notificationv1.NotificationDeliveryMechanism]struct{}, len(items))
	for _, item := range items {
		if item == nil {
			return nil, errors.New("items must not contain null values")
		}

		eventTypeKey := strings.TrimSpace(item.EventTypeKey)
		if eventTypeKey == "" {
			return nil, errors.New("eventTypeKey is required")
		}

		if _, exists := result[eventTypeKey]; exists {
			return nil, fmt.Errorf("duplicate eventTypeKey %q", eventTypeKey)
		}

		enabledMechanisms := make(map[notificationv1.NotificationDeliveryMechanism]struct{}, len(item.DeliveryMechanisms))
		for _, deliveryMechanism := range item.DeliveryMechanisms {
			if deliveryMechanism == notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_UNSPECIFIED {
				continue
			}
			normalized, valid := normalizeSupportedDeliveryMechanism(deliveryMechanism)
			if !valid {
				return nil, fmt.Errorf("unsupported delivery mechanism %d", deliveryMechanism)
			}
			enabledMechanisms[normalized] = struct{}{}
		}

		result[eventTypeKey] = enabledMechanisms
	}

	return result, nil
}

func normalizeSupportedDeliveryMechanism(
	deliveryMechanism notificationv1.NotificationDeliveryMechanism,
) (notificationv1.NotificationDeliveryMechanism, bool) {
	switch deliveryMechanism {
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL,
		notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS:
		return deliveryMechanism, true
	default:
		return notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_UNSPECIFIED, false
	}
}

func hasDeliveryMechanismInItems(
	itemsByEventType map[string]map[notificationv1.NotificationDeliveryMechanism]struct{},
	mechanism notificationv1.NotificationDeliveryMechanism,
) bool {
	for _, mechanisms := range itemsByEventType {
		if _, exists := mechanisms[mechanism]; exists {
			return true
		}
	}

	return false
}

func normalizeMechanismList(
	deliveryMechanisms []notificationv1.NotificationDeliveryMechanism,
) []notificationv1.NotificationDeliveryMechanism {
	if len(deliveryMechanisms) == 0 {
		return []notificationv1.NotificationDeliveryMechanism{}
	}

	seen := make(map[notificationv1.NotificationDeliveryMechanism]struct{}, len(deliveryMechanisms))
	result := make([]notificationv1.NotificationDeliveryMechanism, 0, len(deliveryMechanisms))
	for _, mechanism := range deliveryMechanisms {
		if _, exists := seen[mechanism]; exists {
			continue
		}
		seen[mechanism] = struct{}{}
		result = append(result, mechanism)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i] < result[j]
	})

	return result
}

func denormalizeDeliveryMechanism(preference model.Preference) notificationv1.NotificationDeliveryMechanism {
	if !preference.IsEnabled {
		return notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_UNSPECIFIED
	}

	deliveryMechanism := notificationv1.NotificationDeliveryMechanism(preference.DeliveryMechanism)
	switch deliveryMechanism {
	case notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_EMAIL,
		notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_SMS:
		return deliveryMechanism
	default:
		return notificationv1.NotificationDeliveryMechanism_NOTIFICATION_DELIVERY_MECHANISM_UNSPECIFIED
	}
}

func normalizePreferenceOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func normalizePreferenceOptionalEmail(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.ToLower(strings.TrimSpace(*value))
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func normalizePreferenceOptionalPhone(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func derivePreferencePhoneNumber(preferences []model.Preference) *string {
	for _, preference := range preferences {
		if !preference.IsEnabled {
			continue
		}

		if normalized := normalizePreferenceOptionalPhone(preference.UserPhone); normalized != nil {
			return normalized
		}
	}

	for _, preference := range preferences {
		if normalized := normalizePreferenceOptionalPhone(preference.UserPhone); normalized != nil {
			return normalized
		}
	}

	return nil
}

func derivePreferenceEmail(preferences []model.Preference, userSnapshot *preferenceSnapshotUser) *string {
	for _, preference := range preferences {
		if !preference.IsEnabled {
			continue
		}

		if normalized := normalizePreferenceOptionalEmail(preference.UserEmail); normalized != nil {
			return normalized
		}
	}

	for _, preference := range preferences {
		if normalized := normalizePreferenceOptionalEmail(preference.UserEmail); normalized != nil {
			return normalized
		}
	}

	if userSnapshot == nil {
		return nil
	}

	return normalizePreferenceOptionalEmail(userSnapshot.Email)
}
