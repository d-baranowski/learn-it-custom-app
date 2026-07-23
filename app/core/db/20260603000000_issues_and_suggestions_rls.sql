-- +goose Up
-- +goose StatementBegin

-- Backfill therapist permission before RLS is enabled.
-- This is required in environments where bootstrap SQL is not executed.
insert into core.permission (role_id, key, abilities, scope, revoke, created_at, created_by)
select
    r.id,
    'IssuesAndSuggestions',
    '{Autocomplete,Create,Get,List,Update}'::text[],
    1,
    false,
    core.unix_timestamp(),
    core.system_user_id()
from core.role r
where lower(r.name) = 'therapist'
  and not exists (
    select 1
    from core.permission p
    where p.role_id = r.id
      and p.key = 'IssuesAndSuggestions'
      and p.scope = 1
      and p.revoke = false
  );

-- Enable RLS for issues_and_suggestions table (scope: 2=ALL, 1=OWN via created_by)
alter table core.issues_and_suggestions enable row level security;
alter table core.issues_and_suggestions force row level security;

create policy issues_and_suggestions_select_policy on core.issues_and_suggestions
    for select
    using (
        core.can_access('IssuesAndSuggestions', 2)
        or (created_by = core.current_user_id() and core.can_access('IssuesAndSuggestions', 1))
    );

create policy issues_and_suggestions_insert_policy on core.issues_and_suggestions
    for insert
    with check (
        core.can_create('IssuesAndSuggestions', 2)
        or core.can_create('IssuesAndSuggestions', 1)
    );

create policy issues_and_suggestions_update_policy on core.issues_and_suggestions
    for update
    using (
        core.can_update('IssuesAndSuggestions', 2)
        or (created_by = core.current_user_id() and core.can_update('IssuesAndSuggestions', 1))
    )
    with check (
        core.can_update('IssuesAndSuggestions', 2)
        or (created_by = core.current_user_id() and core.can_update('IssuesAndSuggestions', 1))
    );

create policy issues_and_suggestions_delete_policy on core.issues_and_suggestions
    for delete
    using (
        core.can_delete('IssuesAndSuggestions', 2)
    );

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop policy if exists issues_and_suggestions_delete_policy on core.issues_and_suggestions;
drop policy if exists issues_and_suggestions_update_policy on core.issues_and_suggestions;
drop policy if exists issues_and_suggestions_insert_policy on core.issues_and_suggestions;
drop policy if exists issues_and_suggestions_select_policy on core.issues_and_suggestions;
alter table core.issues_and_suggestions disable row level security;
alter table core.issues_and_suggestions no force row level security;
-- +goose StatementEnd
