-- +goose Up
-- +goose StatementBegin

-- System-wide settings table with version history.
-- Each update inserts a new row with an incremented version.
-- The latest row (highest version) is the active settings.
CREATE TABLE IF NOT EXISTS core.system_settings (
    id              text    NOT NULL DEFAULT core.ksuid()
        CONSTRAINT system_settings_pkey PRIMARY KEY,

    -- Version number, incremented on each update
    version         integer NOT NULL DEFAULT 1,

    -- System timezone used as default for sessions and display
    system_timezone text    NOT NULL DEFAULT 'Europe/Warsaw',

    -- Default session duration in minutes
    session_default_duration_minutes integer NOT NULL DEFAULT 50,

    -- Audit fields
    created_at      bigint  NOT NULL DEFAULT core.unix_timestamp(),
    created_by      text    NOT NULL DEFAULT core.system_user_id(),
    updated_at      bigint,
    updated_by      text
);

COMMENT ON TABLE core.system_settings IS 'System-wide configuration settings with version history. Latest version is the active row.';
COMMENT ON COLUMN core.system_settings.id IS 'Primary key (KSUID)';
COMMENT ON COLUMN core.system_settings.version IS 'Settings version number, incremented on each update';
COMMENT ON COLUMN core.system_settings.system_timezone IS 'System default timezone (IANA format, e.g. Europe/Warsaw)';
COMMENT ON COLUMN core.system_settings.session_default_duration_minutes IS 'Default therapy session duration in minutes';
COMMENT ON COLUMN core.system_settings.created_at IS 'Creation timestamp (Unix milliseconds)';
COMMENT ON COLUMN core.system_settings.created_by IS 'User ID who created this version';
COMMENT ON COLUMN core.system_settings.updated_at IS 'Last update timestamp (Unix milliseconds)';
COMMENT ON COLUMN core.system_settings.updated_by IS 'User ID who last updated this version';

-- Insert the initial default settings row (version 1)
INSERT INTO core.system_settings (id, version, system_timezone, session_default_duration_minutes)
VALUES (core.ksuid(), 1, 'Europe/Warsaw', 50);

-- Index to quickly get the latest version
CREATE INDEX idx_system_settings_version ON core.system_settings (version DESC);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS core.system_settings;
-- +goose StatementEnd
