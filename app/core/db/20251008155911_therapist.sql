-- +goose Up
-- +goose StatementBegin
create table if not exists core."therapist"
(
  id                       char(27) default core.ksuid() not null
    primary key,

  user_id                  char(27)                      not null
    references core."user" on delete cascade deferrable initially deferred,

  professional_title       jsonb,
  description              jsonb,
  language_ids             text[]   default '{}'::text[] not null,
  in_person_therapy_format boolean  default true         not null,
  online_therapy_format    boolean  default true         not null,
  profile_image            text,
  contact_email            text                          not null,
  contact_phone            text,
  is_accepting_new_clients boolean  default true         not null,
  slug                     text                          not null unique,
  meta_description         jsonb,
  search_tags              text[]   default '{}'::text[] not null,

  -- Percentage of revenue shared with the platform (e.g. 40.00 means 40%)
  percentage_profit_sharing numeric(5,2) default 40.00 not null,

  created_at               bigint                        not null,
  created_by               text                          not null,
  updated_at               bigint,
  updated_by               text,
  deleted_at               bigint,
  deleted_by               text
);

-- Enable RLS for therapist table
alter table core.therapist enable row level security;
alter table core.therapist force row level security;

-- Helper function to check therapist access with scope support (2=ALL, 1=OWN)
create or replace function core.check_therapist_access(p_user_id text)
  returns boolean as $$
declare
  curr_usr text;
  has_all_scope boolean;
  is_owner boolean;
begin
  curr_usr := core.current_user_id();
  
  -- Check if user has 'All' scope permission (2)
  has_all_scope := core.can_access('Therapist', 2);
  
  -- Check if user owns this record
  is_owner := (curr_usr is not null and p_user_id = curr_usr);
  
  -- Grant access if has All scope OR (has Own scope AND is owner)
  return has_all_scope or (is_owner and core.can_access('Therapist', 1));
end;
$$ language plpgsql security definer stable;

create policy therapist_select_policy on core.therapist
  for select
  using (core.check_therapist_access(user_id));

create policy therapist_insert_policy on core.therapist
  for insert
  with check (
    core.can_create('Therapist', 2) or
    (user_id = core.current_user_id() and core.can_create('Therapist', 1))
  );

create policy therapist_update_policy on core.therapist
  for update
  using (core.check_therapist_access(user_id))
  with check (
    -- Admin with All scope can update anything
    core.can_update('Therapist', 2) or
    -- Owner with Own scope can update but not percentage_profit_sharing
    (user_id = core.current_user_id() and 
     core.can_update('Therapist', 1) and
     percentage_profit_sharing is not distinct from (
       select t.percentage_profit_sharing
       from core.therapist t
       where t.id = therapist.id
     ))
  );

create policy therapist_delete_policy on core.therapist
  for delete
  using (
    core.can_delete('Therapist', 2) or
    (user_id = core.current_user_id() and core.can_delete('Therapist', 1))
  );

-- Helper function to get current user's therapist ID
create or replace function core.current_user_therapist_id() returns character
  stable
  security definer
  language plpgsql
as
$$
declare
  therapist_id_val char(27);
begin
  select t.id into therapist_id_val
  from core.therapist t
  where t.user_id = core.current_user_id();

  return therapist_id_val;  -- Returns NULL if not found
end;
$$;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop function if exists core.current_user_therapist_id();
drop function if exists core.check_therapist_access(text);
drop policy if exists therapist_delete_policy on core.therapist;
drop policy if exists therapist_update_policy on core.therapist;
drop policy if exists therapist_insert_policy on core.therapist;
drop policy if exists therapist_select_policy on core.therapist;
alter table core.therapist disable row level security;
alter table core.therapist no force row level security;
drop table if exists core."therapist";
-- +goose StatementEnd
