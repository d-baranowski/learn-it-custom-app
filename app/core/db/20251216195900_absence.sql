-- +goose Up
-- +goose StatementBegin
create table if not exists core.absence
(
  id  char(27) default core.ksuid() not null primary key,

  therapist_id char(27) references core.therapist(id) on delete cascade,
  external_id text,

  from_time bigint not null,
  till_time bigint not null,

  reason text,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint absence_time_check check (till_time > from_time)
);

-- Create index for querying absences by therapist
create index if not exists idx_absence_therapist_id on core.absence(therapist_id);

-- Create index for querying absences by time range
create index if not exists idx_absence_time_range on core.absence(from_time, till_time);

-- Create index for organization-wide absences (null therapist_id)
create index if not exists idx_absence_org_wide on core.absence(therapist_id) where therapist_id is null;

-- Create unique index for external_id when it's not null
create unique index if not exists idx_absence_external_id_unique on core.absence(external_id) where external_id is not null;

-- Enable RLS for absence table (scope: 2=ALL, 1=OWN)
alter table core.absence enable row level security;
alter table core.absence force row level security;

create policy absence_select_policy on core.absence
    for select
    using (
        core.can_access('Absence', 2)
        or therapist_id is null  -- organization-wide absences
        or (therapist_id = core.current_user_therapist_id() and core.can_access('Absence', 1))
    );

create policy absence_insert_policy on core.absence
    for insert
    with check (
        core.can_create('Absence', 2)
        or therapist_id is null  -- organization-wide absences
        or (therapist_id = core.current_user_therapist_id() and core.can_create('Absence', 1))
    );

create policy absence_update_policy on core.absence
    for update
    using (
        core.can_update('Absence', 2)
        or therapist_id is null
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Absence', 1))
    )
    with check (
        core.can_update('Absence', 2)
        or therapist_id is null
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Absence', 1))
    );

create policy absence_delete_policy on core.absence
    for delete
    using (
        core.can_delete('Absence', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('Absence', 1))
    );

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop policy if exists absence_delete_policy on core.absence;
drop policy if exists absence_update_policy on core.absence;
drop policy if exists absence_insert_policy on core.absence;
drop policy if exists absence_select_policy on core.absence;
alter table core.absence disable row level security;
alter table core.absence no force row level security;
drop table if exists core.absence;
-- +goose StatementEnd
