-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'core_event_pub') THEN
        CREATE PUBLICATION core_event_pub FOR TABLE core.session, core.therapist;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
DROP PUBLICATION IF EXISTS core_event_pub;
