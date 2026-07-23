-- +goose Up
-- +goose StatementBegin
-- Drop the existing default before changing column type
alter table core.issues_and_suggestions 
  alter column status drop default;

-- Convert existing text status values to integer enum values
-- This assumes no data exists yet, or converts any existing values to 1 as default
alter table core.issues_and_suggestions 
  alter column status type int using 1;

-- Set default to 1 (OPEN)
alter table core.issues_and_suggestions 
  alter column status set default 1;

-- Add check constraint to ensure valid enum values (1-5)
alter table core.issues_and_suggestions
  add constraint issues_and_suggestions_status_check 
  check (status >= 1 and status <= 5);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Revert to text type
alter table core.issues_and_suggestions 
  drop constraint if exists issues_and_suggestions_status_check;

alter table core.issues_and_suggestions 
  alter column status type text using 'open';

alter table core.issues_and_suggestions 
  alter column status set default 'open';

-- +goose StatementEnd
