package service

import (
	"context"

	"app/notification/model"

	"github.com/uptrace/bun"
)

type PreferenceDAO interface {
	ListEnabledForUser(ctx context.Context, userID, eventTypeKey string) ([]*model.Preference, error)
	ListAllForUser(ctx context.Context, userID string) ([]*model.Preference, error)
	UpsertPreference(ctx context.Context, pref *model.Preference) error
}

type bunPreferenceDAO struct {
	db *bun.DB
}

func NewPreferenceDAO(db *bun.DB) PreferenceDAO {
	return &bunPreferenceDAO{db: db}
}

func (d *bunPreferenceDAO) ListEnabledForUser(ctx context.Context, userID, eventTypeKey string) ([]*model.Preference, error) {
	var prefs []*model.Preference
	err := d.db.NewSelect().
		Model(&prefs).
		Where("user_id = ?", userID).
		Where("event_type_key = ?", eventTypeKey).
		Where("enabled = true").
		Where("deleted_at IS NULL").
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return prefs, nil
}

func (d *bunPreferenceDAO) ListAllForUser(ctx context.Context, userID string) ([]*model.Preference, error) {
	var prefs []*model.Preference
	err := d.db.NewSelect().
		Model(&prefs).
		Where("user_id = ?", userID).
		Where("deleted_at IS NULL").
		OrderExpr("event_type_key ASC, delivery_mechanism ASC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return prefs, nil
}

func (d *bunPreferenceDAO) UpsertPreference(ctx context.Context, pref *model.Preference) error {
	_, err := d.db.NewInsert().
		Model(pref).
		On("CONFLICT (user_id, event_type_key, delivery_mechanism) WHERE deleted_at IS NULL DO UPDATE").
		Set("enabled = EXCLUDED.enabled").
		Set("language = EXCLUDED.language").
		Set("updated_at = EXCLUDED.created_at").
		Set("updated_by = EXCLUDED.created_by").
		Exec(ctx)
	return err
}
