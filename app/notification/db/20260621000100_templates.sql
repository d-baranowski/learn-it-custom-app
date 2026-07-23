-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS notification.template (
  id text PRIMARY KEY DEFAULT core.ksuid(),
  event_type_key text NOT NULL,
  title text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at bigint NOT NULL DEFAULT core.unix_timestamp(),
  created_by text NOT NULL DEFAULT core.system_user_id(),
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS template_event_type_key_active_uq
  ON notification.template (event_type_key)
  WHERE deleted_at IS NULL AND active = true;

CREATE TABLE IF NOT EXISTS notification.template_variant (
  id text PRIMARY KEY DEFAULT core.ksuid(),
  template_id text NOT NULL REFERENCES notification.template(id),
  language text NOT NULL,
  delivery_mechanism integer NOT NULL,
  subject text,
  body text NOT NULL,
  created_at bigint NOT NULL DEFAULT core.unix_timestamp(),
  created_by text NOT NULL DEFAULT core.system_user_id(),
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS template_variant_uq
  ON notification.template_variant (template_id, language, delivery_mechanism)
  WHERE deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS notification.template_variant;
DROP TABLE IF EXISTS notification.template;
-- +goose StatementEnd
