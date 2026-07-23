-- +goose Up
-- +goose StatementBegin
--
-- Partial indexes on soft-deleted tables.
--
-- Every entity-listing query in the app filters by `deleted_at IS NULL`
-- (the soft-delete predicate). The current full-row B-tree indexes
-- include deleted entries, which:
--   1. Wastes index pages on rows the app never reads.
--   2. Forces an extra `Index Cond → Filter` step in plans that combine
--      a soft-delete filter with another predicate.
--
-- Each partial index below mirrors the existing full index but adds a
-- `WHERE deleted_at IS NULL` predicate. The originals are left in place
-- so admin/audit queries that need to see deleted rows still have an
-- index to use; they can be dropped in a follow-up migration once perf
-- is verified.
--
-- A `(created_at DESC) WHERE deleted_at IS NULL` index is also added per
-- entity so paginated lists (`ORDER BY created_at DESC LIMIT 100`) can
-- use an index-only path without touching the heap for sorting.
--
-- Note: CREATE INDEX takes a brief ACCESS EXCLUSIVE lock. For a
-- larger production rollout, switch each statement to
-- CONCURRENTLY and use the goose no-transaction directive at the top
-- of the file (see goose docs).

-- ============================================================
-- therapy
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_therapy_therapist_id_active
  ON core.therapy (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapy_service_id_active
  ON core.therapy (service_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapy_room_id_active
  ON core.therapy (room_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapy_date_range_active
  ON core.therapy (start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapy_active_created_desc
  ON core.therapy (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- session
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_session_date_active
  ON core.session (date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_date_start_time_active
  ON core.session (date, start_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_room_id_active
  ON core.session (room_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_therapist_id_active
  ON core.session (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_therapy_id_active
  ON core.session (therapy_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_active_created_desc
  ON core.session (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- absence
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_absence_therapist_id_active
  ON core.absence (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_absence_time_range_active
  ON core.absence (from_time, till_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_absence_active_created_desc
  ON core.absence (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- working_hours
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_working_hours_therapist_id_active
  ON core.working_hours (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_working_hours_day_of_week_active
  ON core.working_hours (therapist_id, day_of_week) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_working_hours_active_created_desc
  ON core.working_hours (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- room
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_room_office_id_active
  ON core.room (office_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_room_active_created_desc
  ON core.room (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- recurring_cashflow + transaction
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recurring_cashflow_date_range_active
  ON core.recurring_cashflow (start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_cashflow_active_created_desc
  ON core.recurring_cashflow (created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transaction_incurred_at_active
  ON core.transaction (incurred_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_recurring_cashflow_id_active
  ON core.transaction (recurring_cashflow_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_active_created_desc
  ON core.transaction (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- entities without other secondary indexes — pagination only
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customer_active_created_desc
  ON core.customer (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapist_active_created_desc
  ON core.therapist (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_service_active_created_desc
  ON core.service (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_office_active_created_desc
  ON core.office (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_active_created_desc
  ON core."user" (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_active_created_desc
  ON core.team (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_role_active_created_desc
  ON core.role (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permission_active_created_desc
  ON core.permission (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_and_suggestions_active_created_desc
  ON core.issues_and_suggestions (created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- junction tables (no created_at-based listing typically; just FK)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_therapist_customer_therapist_active
  ON core.therapist_customer (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapist_customer_customer_active
  ON core.therapist_customer (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapist_service_therapist_active
  ON core.therapist_service (therapist_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_therapist_service_service_active
  ON core.therapist_service (service_id) WHERE deleted_at IS NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS core.idx_therapy_therapist_id_active;
DROP INDEX IF EXISTS core.idx_therapy_service_id_active;
DROP INDEX IF EXISTS core.idx_therapy_room_id_active;
DROP INDEX IF EXISTS core.idx_therapy_date_range_active;
DROP INDEX IF EXISTS core.idx_therapy_active_created_desc;

DROP INDEX IF EXISTS core.idx_session_date_active;
DROP INDEX IF EXISTS core.idx_session_date_start_time_active;
DROP INDEX IF EXISTS core.idx_session_room_id_active;
DROP INDEX IF EXISTS core.idx_session_therapist_id_active;
DROP INDEX IF EXISTS core.idx_session_therapy_id_active;
DROP INDEX IF EXISTS core.idx_session_active_created_desc;

DROP INDEX IF EXISTS core.idx_absence_therapist_id_active;
DROP INDEX IF EXISTS core.idx_absence_time_range_active;
DROP INDEX IF EXISTS core.idx_absence_active_created_desc;

DROP INDEX IF EXISTS core.idx_working_hours_therapist_id_active;
DROP INDEX IF EXISTS core.idx_working_hours_day_of_week_active;
DROP INDEX IF EXISTS core.idx_working_hours_active_created_desc;

DROP INDEX IF EXISTS core.idx_room_office_id_active;
DROP INDEX IF EXISTS core.idx_room_active_created_desc;

DROP INDEX IF EXISTS core.idx_recurring_cashflow_date_range_active;
DROP INDEX IF EXISTS core.idx_recurring_cashflow_active_created_desc;
DROP INDEX IF EXISTS core.idx_transaction_incurred_at_active;
DROP INDEX IF EXISTS core.idx_transaction_recurring_cashflow_id_active;
DROP INDEX IF EXISTS core.idx_transaction_active_created_desc;

DROP INDEX IF EXISTS core.idx_customer_active_created_desc;
DROP INDEX IF EXISTS core.idx_therapist_active_created_desc;
DROP INDEX IF EXISTS core.idx_service_active_created_desc;
DROP INDEX IF EXISTS core.idx_office_active_created_desc;
DROP INDEX IF EXISTS core.idx_user_active_created_desc;
DROP INDEX IF EXISTS core.idx_team_active_created_desc;
DROP INDEX IF EXISTS core.idx_role_active_created_desc;
DROP INDEX IF EXISTS core.idx_permission_active_created_desc;
DROP INDEX IF EXISTS core.idx_issues_and_suggestions_active_created_desc;

DROP INDEX IF EXISTS core.idx_therapist_customer_therapist_active;
DROP INDEX IF EXISTS core.idx_therapist_customer_customer_active;
DROP INDEX IF EXISTS core.idx_therapist_service_therapist_active;
DROP INDEX IF EXISTS core.idx_therapist_service_service_active;

-- +goose StatementEnd
