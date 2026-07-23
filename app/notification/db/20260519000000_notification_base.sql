-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS notification;

CREATE TABLE IF NOT EXISTS notification.notification (
  id text PRIMARY KEY DEFAULT core.ksuid(),
  recipient_user_id text,
  recipient_label text,
  recipient_email text,
  recipient_phone text,
  source_idempotency_key text,
  delivery_mechanism integer NOT NULL,
  status integer NOT NULL,
  subject text,
  body text NOT NULL,
  error_message text,
  sent_at bigint,
  attempt_count integer NOT NULL DEFAULT 0,
  last_attempt_at bigint,
  next_attempt_at bigint,
  provider_message_id text,
  delivery_status integer NOT NULL DEFAULT 0,
  delivery_status_updated_at bigint,
  delivery_failure_reason text,
  scheduled_at bigint,
  created_at bigint NOT NULL DEFAULT core.unix_timestamp(),
  created_by text NOT NULL DEFAULT core.system_user_id(),
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS notification_recipient_user_id_idx
  ON notification.notification (recipient_user_id);

CREATE INDEX IF NOT EXISTS notification_status_idx
  ON notification.notification (status);

CREATE INDEX IF NOT EXISTS notification_dispatch_pending_idx
  ON notification.notification (next_attempt_at NULLS FIRST, created_at)
  WHERE status IN (1, 4) AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS notification_provider_message_id_idx
  ON notification.notification (provider_message_id)
  WHERE provider_message_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notification_source_idempotency_uq
  ON notification.notification (recipient_user_id, source_idempotency_key, delivery_mechanism)
  WHERE source_idempotency_key IS NOT NULL AND recipient_user_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notification_source_idempotency_external_uq
  ON notification.notification (COALESCE(recipient_email, ''), COALESCE(recipient_phone, ''), source_idempotency_key, delivery_mechanism)
  WHERE source_idempotency_key IS NOT NULL AND recipient_user_id IS NULL AND deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS notification.notification;
DROP SCHEMA IF EXISTS notification;
-- +goose StatementEnd
