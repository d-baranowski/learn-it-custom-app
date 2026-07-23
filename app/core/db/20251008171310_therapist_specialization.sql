-- +goose Up
-- +goose StatementBegin
create table if not exists core."therapist_service"
(
  id                 char(27) default core.ksuid() not null
    primary key,

  therapist_id      char(27)
    references core."therapist" on delete cascade deferrable initially deferred,
  service_id char(27)
    references core.service on delete cascade deferrable initially deferred,
  price             numeric(19, 4),

  created_at         bigint                        not null,
  created_by         text                          not null,
  updated_at         bigint,
  updated_by         text,
  deleted_at         bigint,
  deleted_by         text
);

-- Enable RLS for therapist_service table (scope: 2=ALL, 1=OWN)
alter table core.therapist_service enable row level security;
alter table core.therapist_service force row level security;

create policy therapist_service_select_policy on core.therapist_service
    for select
    using (
        core.can_access('TherapistService', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_access('TherapistService', 1))
    );

create policy therapist_service_insert_policy on core.therapist_service
    for insert
    with check (
        core.can_create('TherapistService', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_create('TherapistService', 1))
    );

create policy therapist_service_update_policy on core.therapist_service
    for update
    using (
        core.can_update('TherapistService', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('TherapistService', 1))
    )
    with check (
        core.can_update('TherapistService', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('TherapistService', 1))
    );

create policy therapist_service_delete_policy on core.therapist_service
    for delete
    using (
        core.can_delete('TherapistService', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('TherapistService', 1))
    );

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop policy if exists therapist_service_delete_policy on core.therapist_service;
drop policy if exists therapist_service_update_policy on core.therapist_service;
drop policy if exists therapist_service_insert_policy on core.therapist_service;
drop policy if exists therapist_service_select_policy on core.therapist_service;
alter table core.therapist_service disable row level security;
alter table core.therapist_service no force row level security;
drop table if exists core."therapist";
-- +goose StatementEnd
