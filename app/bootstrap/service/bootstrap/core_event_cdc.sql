-- Restore core-event's CDC wiring after core schema resets.
--
-- The dev ResetDatabase flow runs DROP SCHEMA core CASCADE, which removes
-- core.session / core.therapist from the core_event_pub publication and
-- resets their replica identity — while core-event's goose version table
-- (outside the core schema) still marks its migrations as applied. Without
-- this step the WAL publisher silently emits nothing after any reset.
-- Mirrors app/core-event/db migrations; keep the two in sync.

ALTER TABLE core.session REPLICA IDENTITY FULL;
ALTER TABLE core.therapist REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'core_event_pub') THEN
        CREATE PUBLICATION core_event_pub FOR TABLE core.session, core.therapist;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'core_event_pub' AND schemaname = 'core' AND tablename = 'session'
    ) THEN
        ALTER PUBLICATION core_event_pub ADD TABLE core.session;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'core_event_pub' AND schemaname = 'core' AND tablename = 'therapist'
    ) THEN
        ALTER PUBLICATION core_event_pub ADD TABLE core.therapist;
    END IF;
END $$;
