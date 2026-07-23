-- +goose Up
-- +goose StatementBegin

-- This migration file previously contained RLS policies for multiple tables.
-- All RLS policies have been moved to their respective table creation migrations
-- to ensure RLS is defined alongside the table structure.
--
-- The helper functions (current_user_therapist_id, check_therapist_access, user_has_all_permission)
-- have also been moved to their appropriate migration files:
-- - user_has_all_permission: already in permissions.sql
-- - current_user_therapist_id and check_therapist_access: moved to therapist.sql

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- No-op: RLS policies are now managed in individual table migrations

-- +goose StatementEnd
