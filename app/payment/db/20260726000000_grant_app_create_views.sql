-- Grant the `app` login role CREATE on the payment schema so it can materialise the
-- grid views it builds at runtime.
--
-- 20260725000000_grant_app_access granted USAGE, which is enough to READ the
-- schema but not to create objects in it. The grid layer generates a view per
-- (entity, column-shape, locale) on first use, e.g.
--
--   CREATE VIEW payment.<entity>_<hash>_en
--     WITH (security_barrier = true, security_invoker = true) AS SELECT ...
--
-- so every grid failed with:
--
--   ERROR: permission denied for schema payment (SQLSTATE 42501)
--
-- Note that message is identical for missing USAGE and missing CREATE, which
-- makes this easy to misdiagnose: `has_schema_privilege(app, payment, 'USAGE')`
-- returns true and looks fine. Check 'CREATE' separately.
--
-- Why this is acceptable for a non-owner runtime role: the generated views are
-- SECURITY INVOKER, so they execute with the caller's privileges and remain
-- subject to the same RLS policies as the underlying tables — app cannot read
-- anything through a view that it could not read directly. CREATE does let app
-- add objects to the schema, which is a real (if narrow) privilege expansion; the
-- alternative would be creating the views through a SECURITY DEFINER helper owned
-- by the migrator, which needs an application change.
--
-- Guarded on the app role existing (dev connects as the postgres superuser with
-- no app role) and idempotent, matching 20260725000000.
--
-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RAISE NOTICE 'Role app does not exist, skipping app CREATE grant';
        RETURN;
    END IF;

    EXECUTE 'GRANT CREATE ON SCHEMA payment TO app';
END
$$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        RETURN;
    END IF;

    EXECUTE 'REVOKE CREATE ON SCHEMA payment FROM app';
END
$$;
-- +goose StatementEnd
