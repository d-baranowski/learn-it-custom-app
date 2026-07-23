-- +goose Up
-- +goose StatementBegin
create table if not exists core.working_hours
(
  id  char(27) default core.ksuid() not null primary key,

  therapist_id char(27) not null references core.therapist(id) on delete cascade,

  day_of_week int not null check (day_of_week >= 1 and day_of_week <= 7),

  from_time time not null,
  till_time time not null,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint working_hours_time_check check (till_time > from_time),
  constraint working_hours_unique_slot unique (therapist_id, day_of_week, from_time, till_time)
);

-- Create index for querying working hours by therapist
create index if not exists idx_working_hours_therapist_id on core.working_hours(therapist_id);

-- Create index for querying working hours by day of week
create index if not exists idx_working_hours_day_of_week on core.working_hours(therapist_id, day_of_week);

-- Enable RLS for working_hours table (scope: 2=ALL, 1=OWN)
alter table core.working_hours enable row level security;
alter table core.working_hours force row level security;

create policy working_hours_select_policy on core.working_hours
    for select
    using (
        core.can_access('Availability', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_access('Availability', 1))
    );

create policy working_hours_insert_policy on core.working_hours
    for insert
    with check (
        core.can_create('Availability', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_create('Availability', 1))
    );

create policy working_hours_update_policy on core.working_hours
    for update
    using (
        core.can_update('Availability', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Availability', 1))
    )
    with check (
        core.can_update('Availability', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Availability', 1))
    );

create policy working_hours_delete_policy on core.working_hours
    for delete
    using (
        core.can_delete('Availability', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('Availability', 1))
    );

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop policy if exists working_hours_delete_policy on core.working_hours;
drop policy if exists working_hours_update_policy on core.working_hours;
drop policy if exists working_hours_insert_policy on core.working_hours;
drop policy if exists working_hours_select_policy on core.working_hours;
alter table core.working_hours disable row level security;
alter table core.working_hours no force row level security;
drop table if exists core.working_hours;
-- +goose StatementEnd
