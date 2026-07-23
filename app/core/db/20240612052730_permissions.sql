-- +goose Up
-- +goose StatementBegin
create table if not exists core.permission
(
    id         char(27) default core.ksuid() not null
        primary key,
    user_id    char(27)
        references core."user" on delete cascade deferrable initially deferred,
    role_id    char(27)
        references core.role on delete cascade deferrable initially deferred,
    key    text                          not null,
    abilities  text[]   default '{}'::text[] not null,
    scope      int      default 1            not null check (scope in (0, 1, 2)), -- 0=UNSPECIFIED, 1=OWN, 2=ALL
    revoke     boolean  default false        not null,
    created_at bigint                        not null,
    created_by text                          not null,
    updated_at bigint,
    updated_by text,
    deleted_at bigint,
    deleted_by text
);

create table if not exists core.user_permission
(
    user_id    char(27)                    not null
        references core."user" on delete cascade deferrable initially deferred,
    key    text                        not null,
    scope  int                         not null, -- 0=UNSPECIFIED, 1=OWN, 2=ALL
    allowed    text[] default '{}'::text[] not null,
    primary key (user_id, key, scope)
);

create or replace view core.user_permission_view(user_id, key, scope, abilities) as
with perms as (
    select permission.role_id,
           permission.user_id,
           permission.key,
           permission.scope,
           permission.abilities,
           permission.revoke
    from core.permission
),
     exp as (
         select u.id as user_id,
                perms.role_id,
                perms.key,
                perms.scope,
                perms.abilities,
                perms.revoke
         from core."user" u
                  left join core.user_role ur
                            on u.id = ur.user_id
                                and (ur.expires_at is null or ur.expires_at > core.unix_timestamp())
                  left join perms on ur.role_id = perms.role_id or perms.user_id = u.id
         where perms.key is not null
     ),
     grants as (
         select exp.user_id,
                exp.key,
                exp.scope,
                array_agg(distinct ability) as abilities
         from exp,
              lateral unnest(exp.abilities) as ability
         where exp.revoke = false
         group by exp.user_id, exp.key, exp.scope
     ),
     revokes as (
         select exp.user_id,
                exp.key,
                exp.scope,
                array_agg(distinct ability) as abilities
         from exp,
              lateral unnest(exp.abilities) as ability
         where exp.revoke = true
         group by exp.user_id, exp.key, exp.scope
     ),
     effective as (
         select g.user_id,
                g.key,
                g.scope,
                array(select unnest(g.abilities) except select unnest(coalesce(r.abilities, '{}'::text[]))) as effective_abilities
         from grants g
                  left join revokes r on g.user_id = r.user_id and g.key = r.key and g.scope = r.scope
     )
select effective.user_id,
       effective.key,
       effective.scope,
       effective.effective_abilities as abilities
from effective
order by effective.user_id, effective.key, effective.scope;

create or replace function core.materialise_user_permission() returns void
    language plpgsql
as
$$
begin
    -- grab the view into a temp table to avoid changes during the merge
    create temp table if not exists user_permission_tmp as
    select * from core.user_permission_view;

    merge into core.user_permission AS target
    using user_permission_tmp AS source
    on target.user_id = source.user_id and target.key = source.key and target.scope = source.scope
    when matched and source.abilities is distinct from target.allowed then
        update
        set allowed   = source.abilities
    when not matched then
        insert (user_id, key, scope, allowed)
        values (source.user_id, source.key, source.scope, source.abilities);

    -- delete where user_id, key, and scope not in view
    delete
    from core.user_permission
    where (user_id, key, scope) not in (select user_id, key, scope from core.user_permission_view);

    -- drop the temp table
    drop table user_permission_tmp;
end;
$$;

create or replace function core.trigger_materialise_user_permission() returns trigger
    language plpgsql
as
$$
begin
    perform core.materialise_user_permission();
    return null;
end;
$$;

-- Trigger for core.permission
create trigger trg_materialise_on_permission
    after insert or update or delete
    on core.permission
    for each statement
execute function core.trigger_materialise_user_permission();

-- Trigger for core.user
create trigger trg_materialise_on_user
    after insert or update or delete
    on core.user
    for each statement
execute function core.trigger_materialise_user_permission();

-- Trigger for core.role
create trigger trg_materialise_on_role
    after insert or update or delete
    on core.role
    for each statement
execute function core.trigger_materialise_user_permission();

-- Trigger for core.user_role
create trigger trg_materialise_on_user_role
    after insert or update or delete
    on core.user_role
    for each statement
execute function core.trigger_materialise_user_permission();

-- Permission check functions that mirror the frontend UserPermissionsContext
-- These functions query core.user_permission_view directly to get current permissions
-- which inherits permissions from roles and direct user assignments, handling revocations
-- Scope values: 0=UNSPECIFIED, 1=OWN, 2=ALL

-- can(ability, key, scope) - Check if user has specific ability on a key with given scope
create or replace function core.can(p_ability text, p_key text, p_scope int default 1)
returns boolean as
$$
declare
    has_permission boolean;
begin
    -- First check if user has 'All' permission with 'All' ability (admin override)
    -- Query user_permission_view directly for real-time permission resolution
    select exists(
        select 1
        from core.user_permission_view
        where user_id = core.current_user_id()
        and key = 'All'
        and 'All' = any(abilities)
    ) into has_permission;

    if has_permission then
        return true;
    end if;

    -- Check if user has the specific ability on the specific key with the requested scope
    select exists(
        select 1
        from core.user_permission_view
        where user_id = core.current_user_id()
        and key = p_key
        and scope = p_scope
        and p_ability = any(abilities)
    ) into has_permission;

    return coalesce(has_permission, false);
end;
$$ language plpgsql security definer stable;

-- can_access(key, scope) - Check if user has List or Get ability (read access)
create or replace function core.can_access(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('List', p_key, p_scope) or core.can('Get', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- can_create(key, scope) - Check if user has Create ability
create or replace function core.can_create(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('Create', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- can_update(key, scope) - Check if user has Update ability
create or replace function core.can_update(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('Update', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- can_soft_delete(key, scope) - Check if user has SoftDelete ability
create or replace function core.can_soft_delete(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('SoftDelete', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- can_delete(key, scope) - Check if user has Delete ability
create or replace function core.can_delete(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('Delete', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- can_import(key, scope) - Check if user has Import ability
create or replace function core.can_import(p_key text, p_scope int default 1)
returns boolean as
$$
begin
    return core.can('Import', p_key, p_scope);
end;
$$ language plpgsql security definer stable;

-- Enable RLS for user table
alter table core.user enable row level security;
alter table core.user force row level security;

-- Scope: 2=ALL, 1=OWN
create policy user_select_policy on core.user
  for select
  using (
  core.can_access('User', 2)
    or (id = core.current_user_id() and core.can_access('User', 1))
  );

create policy user_insert_policy on core.user
  for insert
  with check (core.can_create('User', 2));

create policy user_update_policy on core.user
  for update
  using (
  core.can_update('User', 2)
    or (id = core.current_user_id() and core.can_update('User', 1))
  )
  with check (
  core.can_update('User', 2)
    or (id = core.current_user_id() and core.can_update('User', 1))
  );

create policy user_delete_policy on core.user
  for delete
  using (
  core.can_delete('User', 2)
    or (id = core.current_user_id() and core.can_delete('User', 1))
  );

-- Enable RLS for user_role table
alter table core.user_role enable row level security;
alter table core.user_role force row level security;

create policy user_role_select_policy on core.user_role
  for select
  using (
  core.can_access('UserRole', 2)
    or (user_id = core.current_user_id() and core.can_access('UserRole', 1))
  );

create policy user_role_insert_policy on core.user_role
  for insert
  with check (core.can_create('UserRole', 2));

create policy user_role_update_policy on core.user_role
  for update
  using (core.can_update('UserRole', 2))
  with check (core.can_update('UserRole', 2));

create policy user_role_delete_policy on core.user_role
  for delete
  using (core.can_delete('UserRole', 2));

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop function if exists core.can_import(text, int);
drop function if exists core.can_delete(text, int);
drop function if exists core.can_soft_delete(text, int);
drop function if exists core.can_update(text, int);
drop function if exists core.can_create(text, int);
drop function if exists core.can_access(text, int);
drop function if exists core.can(text, text, int);
drop trigger if exists trg_materialise_on_permission on core.permission;
drop trigger if exists trg_materialise_on_user on core.user;
drop trigger if exists trg_materialise_on_role on core.role;
drop trigger if exists trg_materialise_on_user_role on core.user_role;
drop function if exists core.trigger_materialise_user_permission();
drop function if exists core.materialise_user_permission();
drop view if exists core.user_permission_view cascade;
drop table if exists core.user_permission cascade;
drop table if exists core.permission cascade;
-- +goose StatementEnd
