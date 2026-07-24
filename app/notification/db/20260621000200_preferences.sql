-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS notification.preference (
  id text PRIMARY KEY DEFAULT core.ksuid(),
  user_id text NOT NULL,
  event_type_key text NOT NULL,
  delivery_mechanism integer NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'en',
  user_label text,
  user_email text,
  user_phone text,
  created_at bigint NOT NULL DEFAULT core.unix_timestamp(),
  created_by text NOT NULL DEFAULT core.system_user_id(),
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS preference_user_event_mechanism_uq
  ON notification.preference (user_id, event_type_key, delivery_mechanism)
  WHERE deleted_at IS NULL;

-- RLS: policies are PUBLIC (untargeted), matching every other core policy, so
-- they enforce against whatever non-owner role connects (the `app` role). The
-- table owner (migrations) bypasses via NO FORCE, and privileged service paths
-- bypass via the core.bypass GUC — so there's no role to reference here (the
-- former rls_enabled_role has been removed).
ALTER TABLE notification.preference ENABLE ROW LEVEL SECURITY;

CREATE POLICY preference_select_policy ON notification.preference
  FOR SELECT
  USING (core.can_access('NotificationPreference', 2)
    OR (user_id = core.current_user_id() AND core.can_access('NotificationPreference', 1)));

CREATE POLICY preference_insert_policy ON notification.preference
  FOR INSERT
  WITH CHECK (core.can_create('NotificationPreference', 2)
    OR (user_id = core.current_user_id() AND core.can_create('NotificationPreference', 1)));

CREATE POLICY preference_update_policy ON notification.preference
  FOR UPDATE
  USING (core.can_update('NotificationPreference', 2)
    OR (user_id = core.current_user_id() AND core.can_update('NotificationPreference', 1)));

CREATE POLICY preference_delete_policy ON notification.preference
  FOR DELETE
  USING (core.can_delete('NotificationPreference', 2)
    OR (user_id = core.current_user_id() AND core.can_delete('NotificationPreference', 1)));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS notification.preference;
-- +goose StatementEnd
