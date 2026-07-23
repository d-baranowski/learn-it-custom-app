-- +goose Up
-- +goose StatementBegin

-- Generic key-value store (replaces etcd store)
CREATE UNLOGGED TABLE IF NOT EXISTS core.kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_expires_at ON core.kv_store(expires_at) WHERE expires_at IS NOT NULL;

-- Function to clean up expired keys
CREATE OR REPLACE FUNCTION core.cleanup_expired_kv_store()
RETURNS void AS $$
BEGIN
    DELETE FROM core.kv_store WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Permission store (replaces etcd permission store)
CREATE UNLOGGED TABLE IF NOT EXISTS core.permission_store (
    user_id TEXT PRIMARY KEY,
    permissions JSONB NOT NULL,
    hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_store_expires_at ON core.permission_store(expires_at) WHERE expires_at IS NOT NULL;

-- User store (replaces etcd user store)
CREATE UNLOGGED TABLE IF NOT EXISTS core.user_store (
    user_id TEXT PRIMARY KEY,
    user_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leader election table (replaces etcd election)
CREATE UNLOGGED TABLE IF NOT EXISTS core.leader_election (
    lock_name TEXT PRIMARY KEY,
    leader_id TEXT NOT NULL,
    hostname TEXT NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    session_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leader_election_expires_at ON core.leader_election(expires_at);

-- Function to cleanup expired locks
CREATE OR REPLACE FUNCTION core.cleanup_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM core.leader_election WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Notification triggers for real-time updates

-- Permission store trigger
CREATE OR REPLACE FUNCTION core.notify_permission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('permission_store_changes', json_build_object(
            'operation', 'DELETE',
            'user_id', OLD.user_id,
            'permissions', OLD.permissions
        )::text);
        RETURN OLD;
    ELSE
        PERFORM pg_notify('permission_store_changes', json_build_object(
            'operation', TG_OP,
            'user_id', NEW.user_id,
            'permissions', NEW.permissions
        )::text);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permission_store_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON core.permission_store
FOR EACH ROW EXECUTE FUNCTION core.notify_permission_change();

-- User store trigger
CREATE OR REPLACE FUNCTION core.notify_user_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('user_store_changes', json_build_object(
            'operation', 'DELETE',
            'user_id', OLD.user_id,
            'user_data', OLD.user_data
        )::text);
        RETURN OLD;
    ELSE
        PERFORM pg_notify('user_store_changes', json_build_object(
            'operation', TG_OP,
            'user_id', NEW.user_id,
            'user_data', NEW.user_data
        )::text);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_store_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON core.user_store
FOR EACH ROW EXECUTE FUNCTION core.notify_user_change();

-- KV store trigger
CREATE OR REPLACE FUNCTION core.notify_kv_store_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('kv_store_changes', json_build_object(
            'operation', 'DELETE',
            'key', OLD.key,
            'value', OLD.value
        )::text);
        RETURN OLD;
    ELSE
        PERFORM pg_notify('kv_store_changes', json_build_object(
            'operation', TG_OP,
            'key', NEW.key,
            'value', NEW.value
        )::text);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kv_store_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON core.kv_store
FOR EACH ROW EXECUTE FUNCTION core.notify_kv_store_change();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TRIGGER IF EXISTS kv_store_change_trigger ON core.kv_store;
DROP TRIGGER IF EXISTS permission_store_change_trigger ON core.permission_store;
DROP TRIGGER IF EXISTS user_store_change_trigger ON core.user_store;

DROP FUNCTION IF EXISTS core.notify_kv_store_change();
DROP FUNCTION IF EXISTS core.notify_permission_change();
DROP FUNCTION IF EXISTS core.notify_user_change();
DROP FUNCTION IF EXISTS core.cleanup_expired_locks();
DROP FUNCTION IF EXISTS core.cleanup_expired_kv_store();

DROP TABLE IF EXISTS core.leader_election;
DROP TABLE IF EXISTS core.user_store;
DROP TABLE IF EXISTS core.permission_store;
DROP TABLE IF EXISTS core.kv_store;

-- +goose StatementEnd
