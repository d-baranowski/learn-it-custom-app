-- +goose Up
-- +goose StatementBegin
create table if not exists core."therapist_customer"
(
  id                 char(27) default core.ksuid() not null
    primary key,

  therapist_id      char(27)                      not null
    references core."therapist" on delete cascade deferrable initially deferred,
  customer_id       char(27)                      not null
    references core."customer" on delete cascade deferrable initially deferred,

  created_at         bigint                        not null,
  created_by         text                          not null,
  updated_at         bigint,
  updated_by         text,
  deleted_at         bigint,
  deleted_by         text,

  unique (therapist_id, customer_id)
);

-- Enable RLS for therapist_customer table (scope: 2=ALL, 1=OWN)
alter table core.therapist_customer enable row level security;
alter table core.therapist_customer force row level security;

create policy therapist_customer_select_policy on core.therapist_customer
    for select
    using (
        core.can_access('TherapistCustomer', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_access('TherapistCustomer', 1))
    );

create policy therapist_customer_insert_policy on core.therapist_customer
    for insert
    with check (
        core.can_create('TherapistCustomer', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_create('TherapistCustomer', 1))
    );

create policy therapist_customer_update_policy on core.therapist_customer
    for update
    using (
        core.can_update('TherapistCustomer', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('TherapistCustomer', 1))
    )
    with check (
        core.can_update('TherapistCustomer', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('TherapistCustomer', 1))
    );

create policy therapist_customer_delete_policy on core.therapist_customer
    for delete
    using (
        core.can_delete('TherapistCustomer', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('TherapistCustomer', 1))
    );


-- Enable RLS for customer table (scope: 2=ALL, 1=OWN via therapist_customer)
alter table core.customer enable row level security;
alter table core.customer force row level security;

create policy customer_select_policy on core.customer
  for select
  using (
  core.can_access('Customer', 2)
    or (
    core.can_access('Customer', 1)
      and (
        exists (
          select 1 from core.therapist_customer
          where therapist_customer.customer_id = customer.id
            and therapist_customer.therapist_id = core.current_user_therapist_id()
        )
        or customer.created_by = core.current_user_id()
      )
    )
  );

create policy customer_insert_policy on core.customer
  for insert
  with check (
  core.can_create('Customer', 2)
    or core.can_create('Customer', 1)
  );

create policy customer_update_policy on core.customer
  for update
  using (
  core.can_update('Customer', 2)
    or (
    core.can_update('Customer', 1)
      and exists (
      select 1 from core.therapist_customer
      where therapist_customer.customer_id = customer.id
        and therapist_customer.therapist_id = core.current_user_therapist_id()
    )
    )
  )
  with check (
  core.can_update('Customer', 2)
    or (
    core.can_update('Customer', 1)
      and exists (
      select 1 from core.therapist_customer
      where therapist_customer.customer_id = customer.id
        and therapist_customer.therapist_id = core.current_user_therapist_id()
    )
    )
  );

create policy customer_delete_policy on core.customer
  for delete
  using (
  core.can_delete('Customer', 2)
    or (
    core.can_delete('Customer', 1)
      and exists (
      select 1 from core.therapist_customer
      where therapist_customer.customer_id = customer.id
        and therapist_customer.therapist_id = core.current_user_therapist_id()
    )
    )
  );


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop policy if exists therapist_customer_delete_policy on core.therapist_customer;
drop policy if exists therapist_customer_update_policy on core.therapist_customer;
drop policy if exists therapist_customer_insert_policy on core.therapist_customer;
drop policy if exists therapist_customer_select_policy on core.therapist_customer;
drop policy if exists customer_delete_policy on core.customer;
drop policy if exists customer_update_policy on core.customer;
drop policy if exists customer_insert_policy on core.customer;
drop policy if exists customer_select_policy on core.customer;
alter table core.customer disable row level security;
alter table core.customer no force row level security;
alter table core.therapist_customer disable row level security;
alter table core.therapist_customer no force row level security;
drop table if exists core."therapist_customer";
-- +goose StatementEnd
