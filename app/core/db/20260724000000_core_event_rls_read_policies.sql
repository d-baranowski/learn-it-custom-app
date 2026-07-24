-- Permissive RLS read policies for the core-event CDC role.
--
-- Background: core-event's transformers SELECT from core tables to enrich WAL
-- events. On the self-managed (Zalando) clusters the core_event role carried the
-- BYPASSRLS *attribute*, so it skipped every policy — 20260711000000_core_event_grants.sql
-- only grants SELECT and assumes that attribute is already present.
--
-- On Aurora/RDS the master is rds_superuser, NOT a true superuser, and only a
-- true superuser can set BYPASSRLS — so core_event can never get that attribute
-- there. RLS is ENABLE'd (not merely FORCE'd) on the core tables, which subjects
-- every non-owner role (core_event included) to the policies regardless of the
-- force/no-force toggling. The existing SELECT policies gate on app-user context
-- (core.can_access / core.current_user_therapist_id, read from the core.user
-- GUC) that a backend CDC role never sets, so core_event's reads would silently
-- return zero rows — no error, just empty enrichment.
--
-- Fix: add a permissive SELECT policy scoped TO core_event with USING (true) on
-- every RLS-enabled core table. Postgres policies are permissive (OR-combined),
-- so core_event reads all rows while every other role stays restricted. This
-- grants core_event exactly the unfiltered read the BYPASSRLS design intended —
-- no broader exposure — and works on both Aurora and self-managed Postgres.
--
-- Guarded on the role existing so dev (everything connects as the postgres
-- superuser, no core_event role) is a no-op. Runs as the migrator, which owns
-- core.* and can therefore CREATE POLICY on it. Loops over rowsecurity-enabled
-- tables so tables added by later migrations are covered on the next re-run.

-- +goose Up
-- +goose StatementBegin
DO $$
DECLARE
    t record;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RAISE NOTICE 'Role core_event does not exist, skipping RLS read policies';
        RETURN;
    END IF;

    FOR t IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core'
          AND c.relkind IN ('r', 'p')   -- ordinary + partitioned tables
          AND c.relrowsecurity           -- RLS ENABLE'd (force is irrelevant here)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'core'
              AND tablename = t.relname
              AND policyname = 'core_event_read'
        ) THEN
            EXECUTE format(
                'CREATE POLICY core_event_read ON core.%I FOR SELECT TO core_event USING (true)',
                t.relname
            );
        END IF;
    END LOOP;

    RAISE NOTICE 'Applied core_event_read RLS policies to RLS-enabled core tables';
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
DECLARE
    t record;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_event') THEN
        RETURN;
    END IF;

    FOR t IN
        SELECT tablename
        FROM pg_policies
        WHERE schemaname = 'core'
          AND policyname = 'core_event_read'
    LOOP
        EXECUTE format('DROP POLICY core_event_read ON core.%I', t.tablename);
    END LOOP;
END $$;
-- +goose StatementEnd
