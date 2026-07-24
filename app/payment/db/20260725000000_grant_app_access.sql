-- Grant the `app` login role runtime access to the payment schema.
--
-- Replaces the former bootstrap-service grantAppAccess(): schema grants are DDL
-- and belong in migrations. Each service grants its own schema in its own
-- migration, so there's no cross-service ordering race. app is a non-owner
-- runtime role doing CRUD on payment.*, subject to that schema's RLS policies.
--
-- Guarded on the app role existing (dev connects as postgres superuser, no app
-- role). Runs as the migrator, which owns payment.*. Idempotent.
--
-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RAISE NOTICE 'Role app does not exist, skipping app grants';
        RETURN;
    END IF;

    EXECUTE 'GRANT USAGE ON SCHEMA payment TO app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payment TO app';
    EXECUTE 'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA payment TO app';
    EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA payment TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT EXECUTE ON FUNCTIONS TO app';

    RAISE NOTICE 'Granted app access to payment schema';
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RETURN;
    END IF;

    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment REVOKE USAGE, SELECT, UPDATE ON SEQUENCES FROM app';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA payment REVOKE EXECUTE ON FUNCTIONS FROM app';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA payment FROM app';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA payment FROM app';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA payment FROM app';
    EXECUTE 'REVOKE USAGE ON SCHEMA payment FROM app';
END $$;
-- +goose StatementEnd
