-- +goose Up
-- +goose StatementBegin

-- Change the date column from DATE to TEXT to avoid Go bun ORM returning
-- "2026-04-06T00:00:00Z" instead of "2026-04-06" when scanning into a string field.
ALTER TABLE core.session
  ALTER COLUMN date TYPE TEXT USING to_char(date, 'YYYY-MM-DD');

COMMENT ON COLUMN core.session.date IS 'Session date in YYYY-MM-DD format (stored as TEXT)';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE core.session
  ALTER COLUMN date TYPE DATE USING date::date;

COMMENT ON COLUMN core.session.date IS 'Session date in YYYY-MM-DD format';

-- +goose StatementEnd
