-- Grant the dedicated core-event CDC role the privileges it needs at runtime.
--
-- core-event connects as a dedicated CDC role. Its transformers SELECT from core
-- tables to enrich WAL events, and it publishes domain events to pgmq via
-- pgmq.send_topic. On Aurora core_event is a non-owner with no BYPASSRLS, so it
-- reads the RLS-protected core tables via the permissive core_event_read policies
-- (20260724000000_core_event_rls_read_policies.sql); pgmq functions are not
-- SECURITY DEFINER, so those privileges are granted explicitly here.
--
-- Guarded on role existence: in dev every service connects as the postgres
-- superuser and no core_event role exists, so this is a no-op. On staging the
-- grants already exist (previously applied by the bootstrap service) so the
-- statements re-apply idempotently. Runs as the migrator, which owns core.*
-- and pgmq.* and can therefore grant on them.
--
-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RAISE NOTICE 'Role core_event does not exist, skipping CDC grants';
        RETURN;
    END IF;

    EXECUTE 'GRANT CONNECT ON DATABASE ' || quote_ident(current_database()) || ' TO core_event';

    -- Read-only access to core for transformer enrichment. BYPASSRLS on the
    -- role handles the FORCE RLS on core.session/therapist; SELECT is still
    -- required. Granted schema-wide so new transformer reads don't need a
    -- migration change.
    EXECUTE 'GRANT USAGE ON SCHEMA core TO core_event';
    EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA core TO core_event';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT ON TABLES TO core_event';

    -- Publish to pgmq: send_topic resolves bindings (meta, topic_bindings)
    -- then INSERTs into the concrete q_<queue> tables. ALTER DEFAULT PRIVILEGES
    -- (as the migrator) covers queues created by later migrations too.
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA pgmq TO core_event';
        EXECUTE 'GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA pgmq TO core_event';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA pgmq GRANT SELECT, INSERT ON TABLES TO core_event';
    END IF;

    RAISE NOTICE 'Granted core-event CDC privileges to core_event';
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RETURN;
    END IF;

    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core REVOKE SELECT ON TABLES FROM core_event';
    EXECUTE 'REVOKE SELECT ON ALL TABLES IN SCHEMA core FROM core_event';
    EXECUTE 'REVOKE USAGE ON SCHEMA core FROM core_event';

    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA pgmq REVOKE SELECT, INSERT ON TABLES FROM core_event';
        EXECUTE 'REVOKE SELECT, INSERT ON ALL TABLES IN SCHEMA pgmq FROM core_event';
        EXECUTE 'REVOKE USAGE ON SCHEMA pgmq FROM core_event';
    END IF;
END $$;
-- +goose StatementEnd
