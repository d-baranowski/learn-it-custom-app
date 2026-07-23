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

-- RLS is enabled here; policies are created by bootstrap (rls_enabled_role
-- doesn't exist until bootstrap runs, so policies can't reference it in migrations).
ALTER TABLE notification.preference ENABLE ROW LEVEL SECURITY;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS notification.preference;
-- +goose StatementEnd
