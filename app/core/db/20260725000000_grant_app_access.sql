-- Grant the `app` login role runtime access to the core (+ pgmq) schemas.
--
-- Replaces the former bootstrap-service grantAppAccess(): schema grants are DDL
-- and belong in migrations, not in the bootstrap app (which is for seed/test
-- data). Running here also removes the startup race — the bootstrap service could
-- grant before the migrate Jobs had created the schema, silently skipping it.
--
-- app is a non-owner runtime role: it does CRUD on core.* and reads/writes pgmq
-- queues via the pgmq.* SECURITY INVOKER functions, so it needs table privileges
-- (not just EXECUTE). It stays subject to the (uniformly PUBLIC) RLS policies;
-- privileged service paths opt out via the core.bypass GUC.
--
-- Guarded on the app role existing: dev connects as the postgres superuser with
-- no app role, so this is a no-op there. Runs as the migrator, which owns core.*
-- and pgmq.* and can therefore grant on them. Idempotent.
--
-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RAISE NOTICE 'Role app does not exist, skipping app grants';
        RETURN;
    END IF;

    EXECUTE 'GRANT USAGE ON SCHEMA core TO app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO app';
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA core TO app';
    EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT EXECUTE ON FUNCTIONS TO app';

    -- pgmq (installed by 20260621000000_pgmq_install as the migrator): the event
    -- consumers read/write queues via pgmq.* functions, which are not SECURITY
    -- DEFINER, so app needs direct schema + per-queue table access. ALTER DEFAULT
    -- PRIVILEGES covers queues created by later migrations too.
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA pgmq TO app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgmq TO app';
        EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA pgmq TO app';
        EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO app';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA pgmq GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app';
    END IF;

    RAISE NOTICE 'Granted app access to core + pgmq schemas';
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RETURN;
    END IF;

    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core REVOKE USAGE, SELECT, UPDATE ON SEQUENCES FROM app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA core REVOKE EXECUTE ON FUNCTIONS FROM app';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA core FROM app';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA core FROM app';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA core FROM app';
    EXECUTE 'REVOKE USAGE ON SCHEMA core FROM app';

    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq') THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA pgmq REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM app';
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA pgmq FROM app';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA pgmq FROM app';
        EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pgmq FROM app';
        EXECUTE 'REVOKE USAGE ON SCHEMA pgmq FROM app';
    END IF;
END $$;
-- +goose StatementEnd
