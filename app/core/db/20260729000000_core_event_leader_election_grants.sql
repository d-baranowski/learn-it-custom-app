-- Let the core-event CDC role write core.leader_election.
--
-- core-event wires pgstore.Module (pkg/pgstore/fx.go), which provides Election
-- and starts campaigning at boot. The campaign loop does INSERT ... ON CONFLICT
-- DO UPDATE ... RETURNING on core.leader_election, DELETEs on resign, and calls
-- core.cleanup_expired_locks() — a plain (SECURITY INVOKER) function whose body
-- DELETEs from the same table, so it runs with the caller's privileges.
--
-- 20260711000000_core_event_grants.sql grants core_event SELECT on core.* and
-- nothing more, which is right for the transformer enrichment reads but leaves
-- the election loop failing every tick:
--     failed to acquire leadership / failed to cleanup expired locks
--     ERROR: permission denied for table leader_election (SQLSTATE 42501)
-- That is an ACL denial, not RLS — core.leader_election has no RLS enabled, and
-- an RLS block would surface as zero rows or "new row violates row-level
-- security policy" instead.
--
-- Scoped to this one table rather than widening the schema-wide grant: election
-- is the only pgstore component core-event constructs, so the rest of core stays
-- read-only to it.
--
-- Lives in the core set (not app/core-event/db) because core owns the schema and
-- created leader_election in 20251221110000_pg_store.sql — goose orders the two
-- sets independently, so a grant in the core-event set could run before the
-- table exists. Guarded on role existence: dev connects as the postgres
-- superuser with no core_event role, so this is a no-op there. Runs as the
-- migrator, which owns core.* and can therefore grant on it. Idempotent.
--
-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RAISE NOTICE 'Role core_event does not exist, skipping leader election grants';
        RETURN;
    END IF;

    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON core.leader_election TO core_event';

    RAISE NOTICE 'Granted core_event write access to core.leader_election';
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RETURN;
    END IF;

    -- SELECT is left in place: it comes from the schema-wide grant in
    -- 20260711000000_core_event_grants.sql, not from this migration.
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON core.leader_election FROM core_event';
END $$;
-- +goose StatementEnd
