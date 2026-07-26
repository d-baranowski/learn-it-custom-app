-- Drop FORCE ROW LEVEL SECURITY from the remaining core tables so the owner can
-- seed them on Aurora.
--
-- Bootstrap.Run() died at therapists with:
--
--   ERROR: new row violates row-level security policy for table "therapist"
--
-- even though it connects as `migrations`, which OWNS the table. FORCE ROW LEVEL
-- SECURITY makes the owner subject to its own policies, and on Aurora/RDS no
-- role can hold BYPASSRLS — so nothing could insert these rows. The seed reached
-- user/permission/country/language/service (none of which force RLS) and then
-- stopped dead.
--
-- 20240612052730_permissions.sql already settled this policy for core.user:
--
--   "No FORCE: the table owner (the migrator role) must be able to seed and
--    administer users, and on Aurora/RDS no role can hold BYPASSRLS.
--    Application traffic connects as a NON-owner role, so it is still fully
--    subject to the policies below; only the owner (migrations/bootstrap)
--    bypasses them — the pattern AWS recommends for RLS multi-tenancy on RDS."
--
-- The tables below were added later (20251216/20251220/...) and re-introduced
-- FORCE, which was correct on the previous self-managed Postgres — where the
-- migrator held real BYPASSRLS — but cannot work on Aurora. This aligns them
-- with core.user.
--
-- Security impact: none for application traffic. `app` and `core_event` are
-- non-owners and remain fully subject to every policy; RLS itself stays ENABLED
-- on all of these tables. Only `migrations` — used exclusively by the migrate
-- Jobs and the bootstrap seed, never by a running service — is exempt.
--
-- Idempotent: NO FORCE on a table that is already not forced is a no-op.
--
-- +goose Up
-- +goose StatementBegin
alter table core.absence                no force row level security;
alter table core.customer               no force row level security;
alter table core.issues_and_suggestions no force row level security;
alter table core.recurring_cashflow     no force row level security;
alter table core.session                no force row level security;
alter table core.session_customer       no force row level security;
alter table core.therapist              no force row level security;
alter table core.therapist_customer     no force row level security;
alter table core.therapist_service      no force row level security;
alter table core.therapy                no force row level security;
alter table core.therapy_customer       no force row level security;
alter table core.transaction            no force row level security;
alter table core.working_hours          no force row level security;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Restores the pre-Aurora posture. Note this will break the bootstrap seed
-- again: on Aurora the owner has no way past a forced policy.
alter table core.absence                force row level security;
alter table core.customer               force row level security;
alter table core.issues_and_suggestions force row level security;
alter table core.recurring_cashflow     force row level security;
alter table core.session                force row level security;
alter table core.session_customer       force row level security;
alter table core.therapist              force row level security;
alter table core.therapist_customer     force row level security;
alter table core.therapist_service      force row level security;
alter table core.therapy                force row level security;
alter table core.therapy_customer       force row level security;
alter table core.transaction            force row level security;
alter table core.working_hours          force row level security;
-- +goose StatementEnd
