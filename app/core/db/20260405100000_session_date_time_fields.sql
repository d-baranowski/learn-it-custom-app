-- +goose Up
-- +goose StatementBegin

-- Step 1: Add new columns with defaults so existing rows are valid
ALTER TABLE core.session
  ADD COLUMN date DATE,
  ADD COLUMN start_time TEXT,
  ADD COLUMN end_time TEXT,
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw';

-- Step 2: Backfill new columns from existing start_datetime/end_datetime (bigint epoch ms)
-- Convert to timestamptz, then extract date and time in the Europe/Warsaw timezone
UPDATE core.session SET
  date       = (to_timestamp(start_datetime / 1000.0) AT TIME ZONE 'Europe/Warsaw')::date,
  start_time = to_char(to_timestamp(start_datetime / 1000.0) AT TIME ZONE 'Europe/Warsaw', 'HH24:MI'),
  end_time   = to_char(to_timestamp(end_datetime / 1000.0) AT TIME ZONE 'Europe/Warsaw', 'HH24:MI');

-- Step 3: Make the new columns NOT NULL now that they are backfilled
ALTER TABLE core.session
  ALTER COLUMN date SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL;

-- Step 4: Drop old constraint and indexes that reference start_datetime/end_datetime
ALTER TABLE core.session DROP CONSTRAINT IF EXISTS session_datetime_check;
DROP INDEX IF EXISTS core.idx_session_datetime_range;
DROP INDEX IF EXISTS core.idx_session_financial_dashboard;

-- Step 5: Drop old columns
ALTER TABLE core.session DROP COLUMN start_datetime CASCADE;
ALTER TABLE core.session DROP COLUMN end_datetime CASCADE;

-- Step 6: Create new indexes on the new columns
CREATE INDEX idx_session_date ON core.session(date);
CREATE INDEX idx_session_date_start_time ON core.session(date, start_time);
CREATE INDEX idx_session_financial_dashboard ON core.session(date, cancelled_at, deleted_at) WHERE deleted_at IS NULL;

-- Step 7: Add comments
COMMENT ON COLUMN core.session.date IS 'Session date in YYYY-MM-DD format';
COMMENT ON COLUMN core.session.start_time IS 'Session start time in HH:MM format (24h)';
COMMENT ON COLUMN core.session.end_time IS 'Session end time in HH:MM format (24h)';
COMMENT ON COLUMN core.session.timezone IS 'IANA timezone identifier for the session (e.g. Europe/Warsaw)';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Restore old columns
ALTER TABLE core.session
  ADD COLUMN start_datetime BIGINT,
  ADD COLUMN end_datetime BIGINT;

-- Backfill old columns from new fields
UPDATE core.session SET
  start_datetime = (extract(epoch FROM ((date || ' ' || start_time)::timestamp AT TIME ZONE timezone))::bigint) * 1000,
  end_datetime   = (extract(epoch FROM ((date || ' ' || end_time)::timestamp AT TIME ZONE timezone))::bigint) * 1000;

ALTER TABLE core.session
  ALTER COLUMN start_datetime SET NOT NULL,
  ALTER COLUMN end_datetime SET NOT NULL;

-- Restore old constraint and indexes
ALTER TABLE core.session ADD CONSTRAINT session_datetime_check CHECK (end_datetime > start_datetime);
CREATE INDEX idx_session_datetime_range ON core.session(start_datetime, end_datetime);
CREATE INDEX idx_session_financial_dashboard ON core.session(start_datetime, cancelled_at, deleted_at) WHERE deleted_at IS NULL;

-- Drop new columns and indexes
DROP INDEX IF EXISTS core.idx_session_date;
DROP INDEX IF EXISTS core.idx_session_date_start_time;
ALTER TABLE core.session DROP COLUMN date;
ALTER TABLE core.session DROP COLUMN start_time;
ALTER TABLE core.session DROP COLUMN end_time;
ALTER TABLE core.session DROP COLUMN timezone;

-- +goose StatementEnd
