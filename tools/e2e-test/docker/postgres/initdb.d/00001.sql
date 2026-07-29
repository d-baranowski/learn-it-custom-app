-- The runtime application role, mirroring the `app` role Ansible creates on
-- staging (infrastructure/ansible/roles/db_bootstrap/templates/roles.sql.j2).
--
-- This exists so RLS is actually ENFORCED in e2e. Postgres exempts superusers
-- from row level security unconditionally — FORCE does not change it — so while
-- core/gateway/payment connected as `postgres` every policy was inert and every
-- non-admin spec saw the whole table. That is what produced the
-- "Found '20', expected '1'" class of failure: the tests were right, the
-- environment could not enforce what they assert.
--
-- Migrations and the bootstrap seed still connect as `postgres`, which owns
-- core.* and is therefore exempt — the same split staging has between the
-- `migrations` owner and the non-owner `app`.
--
-- Created BEFORE the database so it exists by the time migrations run:
-- 20260725000000_grant_app_access.sql is guarded on this role existing and is
-- otherwise a silent no-op, and it is what grants the schema-level privileges.
CREATE ROLE app LOGIN PASSWORD 'password';

CREATE DATABASE rpg;
\c rpg;

-- Database- and public-schema grants only. Everything under core/pgmq is
-- granted by 20260725000000_grant_app_access.sql once the migrations have
-- created those objects; granting here would run before they exist.
GRANT CONNECT ON DATABASE rpg TO app;
GRANT USAGE ON SCHEMA public TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO app;
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS hypopg;

-- CREATE DATABASE powa ;
-- \c powa
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- CREATE EXTENSION IF NOT EXISTS powa;
-- CREATE EXTENSION IF NOT EXISTS pg_qualstats;
-- CREATE EXTENSION IF NOT EXISTS pg_stat_kcache;

-- CREATE ROLE powa SUPERUSER LOGIN PASSWORD 'powa';

create schema if not exists partman;

create extension if not exists btree_gist;
create extension if not exists pg_partman with schema partman;
create extension if not exists pg_cron;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
