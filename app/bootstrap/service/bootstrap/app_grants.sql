-- Grant the `app` login role access to the application schemas.
--
-- Runs from the bootstrap service as the `migrations` role (the schema owner),
-- after the migrate Jobs have created the schemas. Replaces the former
-- rls_enabled_role: Aurora grants no role BYPASSRLS, and role-scoped policies
-- (TO rls_enabled_role) didn't compose with the core.bypass GUC, so all policies
-- are now PUBLIC and `app` is granted directly. `app` stays a non-owner, so it is
-- fully subject to those policies; privileged service paths set core.bypass.
--
-- Idempotent. Guarded on the app role existing (dev connects as the postgres
-- superuser with no app role). Schema-guarded so it's safe to re-run before all
-- migrations have created every schema.
DO $$
DECLARE
    s text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RAISE NOTICE 'Role app does not exist, skipping app grants';
        RETURN;
    END IF;

    FOREACH s IN ARRAY ARRAY['core', 'payment', 'notification'] LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN
            CONTINUE;
        END IF;
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO app', s);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO app', s);
        EXECUTE format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA %I TO app', s);
        EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO app', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO app', s);
    END LOOP;

    RAISE NOTICE 'Granted app access to core/payment/notification schemas';
END $$;
