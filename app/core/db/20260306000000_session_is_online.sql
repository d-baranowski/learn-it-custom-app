-- +goose Up
-- +goose StatementBegin
ALTER TABLE core.session ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE core.session DROP COLUMN IF EXISTS is_online;
-- +goose StatementEnd
