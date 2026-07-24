-- +goose Up
-- +goose StatementBegin

-- 1. Remove debug RAISE NOTICE from current_user_id() (left over from base migration).
CREATE OR REPLACE FUNCTION core.current_user_id() RETURNS text AS $$
DECLARE user_config text; user_data jsonb; result_user_id text;
BEGIN
  user_config := current_setting('core.user', true);
  IF user_config IS NULL OR user_config = '' THEN RETURN NULL; END IF;
  BEGIN
    user_data := user_config::jsonb;
    result_user_id := user_data ->> 'x-app-user-id';
    IF result_user_id IS NOT NULL AND result_user_id != '' THEN
      RETURN result_user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN RETURN NULL;
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Optimize core.can() to query the materialized user_permission table
--    instead of the expensive 5-CTE user_permission_view.
CREATE OR REPLACE FUNCTION core.can(p_ability text, p_key text, p_scope int DEFAULT 1)
RETURNS boolean AS $$
DECLARE
    curr_user text;
BEGIN
    -- Aurora/RDS grants no role BYPASSRLS, so the repository "SkipRLS" service
    -- paths (e.g. the pre-auth login lookup) set core.bypass='on' for the
    -- transaction to run without row filtering. Honour it here so every RLS
    -- policy — all of which gate on core.can_*() — passes. Fail-closed: unset or
    -- any other value means normal enforcement.
    IF current_setting('core.bypass', true) = 'on' THEN RETURN true; END IF;

    curr_user := core.current_user_id();
    IF curr_user IS NULL THEN RETURN false; END IF;

    IF EXISTS (
        SELECT 1 FROM core.user_permission
        WHERE user_id = curr_user AND key = 'All' AND 'All' = ANY(allowed)
    ) THEN RETURN true; END IF;

    RETURN EXISTS (
        SELECT 1 FROM core.user_permission
        WHERE user_id = curr_user AND key = p_key AND scope = p_scope AND p_ability = ANY(allowed)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Rewrite current_user_therapist_id() to read from session config
--    instead of querying the therapist table per row.
CREATE OR REPLACE FUNCTION core.current_user_therapist_id() RETURNS character AS $$
BEGIN
    RETURN NULLIF(current_setting('core.therapist_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Index on therapist(user_id) for the config-caching query
CREATE INDEX IF NOT EXISTS idx_therapist_user_id ON core.therapist(user_id);

-- 5. Functional index on user(id::text) to fix type mismatch with
--    session.created_by/updated_by/deleted_by (text vs char(27)).
CREATE INDEX IF NOT EXISTS idx_user_id_text ON core."user" ((id::text));

-- 6. Partial index for soft-delete filtering (deleted_at IS NULL).
CREATE INDEX IF NOT EXISTS idx_session_deleted_at_null ON core.session(id) WHERE deleted_at IS NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS core.idx_session_deleted_at_null;
DROP INDEX IF EXISTS core.idx_user_id_text;
DROP INDEX IF EXISTS core.idx_therapist_user_id;

-- Restore original current_user_therapist_id
CREATE OR REPLACE FUNCTION core.current_user_therapist_id() RETURNS character
  STABLE SECURITY DEFINER LANGUAGE plpgsql
AS $$
DECLARE therapist_id_val char(27);
BEGIN
  SELECT t.id INTO therapist_id_val
  FROM core.therapist t
  WHERE t.user_id = core.current_user_id();
  RETURN therapist_id_val;
END;
$$;

-- Restore original core.can() using the view
CREATE OR REPLACE FUNCTION core.can(p_ability text, p_key text, p_scope int DEFAULT 1)
RETURNS boolean AS $$
DECLARE
    has_permission boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM core.user_permission_view
        WHERE user_id = core.current_user_id()
        AND key = 'All'
        AND 'All' = ANY(abilities)
    ) INTO has_permission;
    IF has_permission THEN RETURN true; END IF;

    SELECT EXISTS(
        SELECT 1 FROM core.user_permission_view
        WHERE user_id = core.current_user_id()
        AND key = p_key
        AND scope = p_scope
        AND p_ability = ANY(abilities)
    ) INTO has_permission;
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- +goose StatementEnd
