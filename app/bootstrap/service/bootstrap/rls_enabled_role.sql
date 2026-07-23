-- Create app user for the application to connect to PostgreSQL
-- This user has access to all tables in the core schema but is still subject to RLS

DO $$
BEGIN
    -- Revoke existing privileges in current database for idempotency
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_enabled_role') THEN
        RAISE NOTICE 'User rls_enabled_role already exists, revoking privileges and re-applying';
        -- Revoke all privileges in current database (safe for multi-database clusters)
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA core FROM rls_enabled_role';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core FROM rls_enabled_role';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA core FROM rls_enabled_role';
        EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA core FROM rls_enabled_role';
        -- Revoke payment schema privileges if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payment') THEN
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA payment FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA payment FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA payment FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA payment FROM rls_enabled_role';
        END IF;
        -- Revoke notification schema privileges if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'notification') THEN
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA notification FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA notification FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA notification FROM rls_enabled_role';
            EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA notification FROM rls_enabled_role';
        END IF;
        -- Revoke partman schema privileges if schema exists
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'partman') THEN
            EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA partman FROM rls_enabled_role';
        END IF;
    ELSE
        -- Create the rls_enabled_role role
        EXECUTE 'CREATE ROLE rls_enabled_role NOLOGIN';
        RAISE NOTICE 'Created user: rls_enabled_role';
    END IF;
END $$;

-- Grant connection to the database (use current_database() for portability across DB names)
DO $$ BEGIN
    EXECUTE 'GRANT CONNECT ON DATABASE ' || quote_ident(current_database()) || ' TO rls_enabled_role';
END $$;

-- Grant usage on core schema
GRANT USAGE ON SCHEMA core TO rls_enabled_role;

-- Grant usage on payment schema
GRANT USAGE ON SCHEMA payment TO rls_enabled_role;

-- Grant usage on notification schema
GRANT USAGE ON SCHEMA notification TO rls_enabled_role;

-- Grant usage on partman schema (for partitioning) - conditional, may not exist in all environments
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'partman') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA partman TO rls_enabled_role';
    END IF;
END $$;

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables in core schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO rls_enabled_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables/views in payment schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payment TO rls_enabled_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables/views in notification schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA notification TO rls_enabled_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on all future tables in core schema
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rls_enabled_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on all future tables/views in payment schema
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rls_enabled_role;

-- Grant SELECT, INSERT, UPDATE, DELETE on all future tables/views in notification schema
ALTER DEFAULT PRIVILEGES IN SCHEMA notification GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rls_enabled_role;

-- Grant USAGE, SELECT, UPDATE on all sequences in core schema (for auto-increment IDs)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA core TO rls_enabled_role;

-- Grant USAGE, SELECT, UPDATE on all sequences in payment schema
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA payment TO rls_enabled_role;

-- Grant USAGE, SELECT, UPDATE on all sequences in notification schema
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA notification TO rls_enabled_role;

-- Grant USAGE, SELECT, UPDATE on all future sequences in core schema
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO rls_enabled_role;

-- Grant USAGE, SELECT, UPDATE on all future sequences in payment schema
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO rls_enabled_role;

-- Grant EXECUTE on all functions in core schema (needed for RLS helper functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO rls_enabled_role;

-- Grant EXECUTE on all functions in payment schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA payment TO rls_enabled_role;

-- Grant EXECUTE on all future functions in core schema
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT EXECUTE ON FUNCTIONS TO rls_enabled_role;

-- Grant EXECUTE on all future functions in payment schema
ALTER DEFAULT PRIVILEGES IN SCHEMA payment GRANT EXECUTE ON FUNCTIONS TO rls_enabled_role;

-- Important: DO NOT grant BYPASSRLS privilege
-- This ensures rls_enabled_role is subject to Row Level Security policies
-- The rls_enabled_role will need to set core.user session variable to authenticate as a specific user
-- and will be subject to all RLS policies

-- Verify that rls_enabled_role does NOT have BYPASSRLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_enabled_role' AND rolbypassrls = true) THEN
        RAISE EXCEPTION 'rls_enabled_role should NOT have BYPASSRLS privilege';
    END IF;
    RAISE NOTICE 'rls_enabled_role is subject to Row Level Security - OK';
END $$;

-- Notification preference RLS policies
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'notification' AND table_name = 'preference') THEN
        EXECUTE 'DROP POLICY IF EXISTS preference_select_policy ON notification.preference';
        EXECUTE 'DROP POLICY IF EXISTS preference_insert_policy ON notification.preference';
        EXECUTE 'DROP POLICY IF EXISTS preference_update_policy ON notification.preference';
        EXECUTE 'DROP POLICY IF EXISTS preference_delete_policy ON notification.preference';

        EXECUTE 'CREATE POLICY preference_select_policy ON notification.preference FOR SELECT TO rls_enabled_role USING (core.can_access(''NotificationPreference'', 2) OR (user_id = core.current_user_id() AND core.can_access(''NotificationPreference'', 1)))';
        EXECUTE 'CREATE POLICY preference_insert_policy ON notification.preference FOR INSERT TO rls_enabled_role WITH CHECK (core.can_create(''NotificationPreference'', 2) OR (user_id = core.current_user_id() AND core.can_create(''NotificationPreference'', 1)))';
        EXECUTE 'CREATE POLICY preference_update_policy ON notification.preference FOR UPDATE TO rls_enabled_role USING (core.can_update(''NotificationPreference'', 2) OR (user_id = core.current_user_id() AND core.can_update(''NotificationPreference'', 1)))';
        EXECUTE 'CREATE POLICY preference_delete_policy ON notification.preference FOR DELETE TO rls_enabled_role USING (core.can_delete(''NotificationPreference'', 2) OR (user_id = core.current_user_id() AND core.can_delete(''NotificationPreference'', 1)))';

        RAISE NOTICE 'Notification preference RLS policies created';
    END IF;
END $$;

-- Grant rls_enabled_role to all non-superuser, non-BYPASSRLS login roles
-- so app-level users (e.g. utr_staging_user) inherit schema access while remaining subject to RLS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT rolname FROM pg_roles
        WHERE rolcanlogin = true
          AND rolsuper = false
          AND rolbypassrls = false
          AND rolname != 'rls_enabled_role'
    LOOP
        EXECUTE 'GRANT rls_enabled_role TO ' || quote_ident(r.rolname);
        RAISE NOTICE 'Granted rls_enabled_role to %', r.rolname;
    END LOOP;
END $$;
