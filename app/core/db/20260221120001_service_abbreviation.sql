-- +goose Up
-- +goose StatementBegin
ALTER TABLE core.service ADD COLUMN IF NOT EXISTS display_abbreviation text;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE core.service DROP COLUMN IF EXISTS display_abbreviation;
-- +goose StatementEnd
