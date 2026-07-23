-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS notification.scheduled_reminder (
  id text PRIMARY KEY DEFAULT core.ksuid(),
  event_type_key text NOT NULL,
  entity_id text NOT NULL,
  entity_type text NOT NULL DEFAULT 'session',
  fire_at bigint NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  payload jsonb NOT NULL,
  cancelled_at bigint,
  fired_at bigint,
  created_at bigint NOT NULL DEFAULT core.unix_timestamp(),
  updated_at bigint
);

CREATE INDEX IF NOT EXISTS scheduled_reminder_pending_idx
  ON notification.scheduled_reminder (fire_at)
  WHERE status = 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_reminder_entity_event_uq
  ON notification.scheduled_reminder (entity_id, event_type_key)
  WHERE status = 'PENDING';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS notification.scheduled_reminder;
-- +goose StatementEnd
