-- +goose Up
-- +goose StatementBegin
create table if not exists core."user"
(
  id                   char(27) default core.ksuid() not null
    primary key,
  username             text                          not null,
  display_name         text,
  display_abbreviation text unique,
  display_color        text     default '#00F',
  email                text                          not null
    unique,
  external_id          text,
  password_hash        text,
  reset_pass boolean default false,
  avatar               text,
  disabled             boolean  default false,
  created_at           bigint                        not null,
  created_by           text                          not null,
  updated_at           bigint,
  updated_by           text,
  deleted_at           bigint,
  deleted_by           text
);

create table if not exists core.user_setting
(
  id      char(27) default core.ksuid() not null
    primary key,
  user_id char(27)                      not null
    references core."user" on delete cascade deferrable initially deferred,
  key     text,
  value   jsonb    default '{}'::jsonb
);

create index if not exists user_id_idx
  on core.user_setting (user_id);

create index if not exists key_idx
  on core.user_setting (key);

create table if not exists core.team
(
  id          char(27) default core.ksuid() not null
    primary key,
  name        text                          not null
    unique,
  description text                          not null,
  created_at  bigint                        not null,
  created_by  text                          not null,
  updated_at  bigint,
  updated_by  text,
  deleted_at  bigint,
  deleted_by  text
);

create table if not exists core.user_team
(
  id         char(27) default core.ksuid() not null
    primary key,
  user_id    char(27)                      not null
    references core."user" on delete cascade deferrable initially deferred,
  team_id    char(27)                      not null
    references core.team on delete cascade deferrable initially deferred,
  created_at bigint                        not null,
  created_by text                          not null,
  updated_at bigint,
  updated_by text
);

create table if not exists core.role
(
  id          char(27) default core.ksuid() not null
    primary key,
  name        text                          not null
    unique,
  description text                          not null,
  created_at  bigint                        not null,
  created_by  text                          not null,
  updated_at  bigint,
  updated_by  text,
  deleted_at  bigint,
  deleted_by  text
);

create unique index if not exists udx_role_name
  on core.role (name);

create table if not exists core.user_role
(
  id         char(27) default core.ksuid() not null
    primary key,
  user_id    char(27)                      not null
    references core."user" on delete cascade deferrable initially deferred,
  role_id    char(27)                      not null
    references core.role on delete cascade deferrable initially deferred,
  expires_at bigint,
  created_at bigint                        not null,
  created_by text                          not null,
  updated_at bigint,
  updated_by text,
  constraint user_role_id_user_id_uq
    unique (role_id, user_id)
);

create table if not exists core.user_session
(
  id         char(27) default core.ksuid() not null
    primary key,
  user_id    char(27)                      not null,
  created_at bigint                        not null,
  expires    bigint   default core.unix_timestamp_plus_interval('01:00:00'::interval)
);

create table if not exists core.user_lock
(
  id         char(27) not null
    primary key     default core.ksuid(),
  entity_id  char(27) not null,
  user_id    char(27) not null,
  created_at bigint default core.unix_timestamp(),
  updated_at bigint default core.unix_timestamp(),
  expires_at bigint default core.unix_timestamp_plus_interval(interval '10 minutes')
);

create or replace function core.clear_expired_user_locks()
  returns void as
$$
begin
  delete
  from core.user_lock
  where expires_at < core.unix_timestamp();
end;
$$ language plpgsql;

-- noinspection SqlResolve
select cron.schedule('*/1 * * * *', $$select core.clear_expired_user_locks()$$);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Drop user_role policies
drop policy if exists user_role_delete_policy on core.user_role;
drop policy if exists user_role_update_policy on core.user_role;
drop policy if exists user_role_insert_policy on core.user_role;
drop policy if exists user_role_select_policy on core.user_role;
alter table core.user_role disable row level security;
alter table core.user_role no force row level security;

-- Drop user policies
drop policy if exists user_delete_policy on core.user;
drop policy if exists user_update_policy on core.user;
drop policy if exists user_insert_policy on core.user;
drop policy if exists user_select_policy on core.user;
alter table core.user disable row level security;
alter table core.user no force row level security;
SELECT 'down SQL query';
-- +goose StatementEnd
