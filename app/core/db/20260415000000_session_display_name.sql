-- +goose Up
-- +goose StatementBegin
ALTER TABLE core.session ADD COLUMN display_name TEXT;
COMMENT ON COLUMN core.session.display_name IS 'Session-level display name. For sessions generated from a therapy this is seeded from the therapy display name at generation time. One-off sessions (no therapy) can set this directly so the calendar has a useful label.';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE core.session DROP COLUMN IF EXISTS display_name;
-- +goose StatementEnd
