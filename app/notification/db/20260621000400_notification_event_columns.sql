-- +goose Up
-- +goose StatementBegin
ALTER TABLE notification.notification
  ADD COLUMN IF NOT EXISTS event_type_key text,
  ADD COLUMN IF NOT EXISTS template_id text;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE notification.notification
  DROP COLUMN IF EXISTS template_id,
  DROP COLUMN IF EXISTS event_type_key;
-- +goose StatementEnd
