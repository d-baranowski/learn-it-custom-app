-- +goose Up
-- +goose StatementBegin
create table if not exists core.therapy
(
  id  char(27) default core.ksuid() not null primary key,

  therapist_id char(27) not null references core.therapist(id) on delete restrict deferrable initially deferred,
  service_id char(27) not null references core.service(id) on delete restrict deferrable initially deferred,
  room_id char(27) references core.room(id) on delete set null deferrable initially deferred,
  display_name text not null,

  start_date bigint not null,
  end_date bigint,

  session_price decimal not null,
  session_duration int not null,
  session_frequency jsonb default '[]'::jsonb,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint therapy_end_date_check check (end_date is null or end_date > start_date),
  constraint therapy_session_duration_check check (session_duration > 0)
);

-- Create indexes for therapy table
create index if not exists idx_therapy_therapist_id on core.therapy(therapist_id);
create index if not exists idx_therapy_service_id on core.therapy(service_id);
create index if not exists idx_therapy_date_range on core.therapy(start_date, end_date);
create index if not exists idx_therapy_room_id on core.therapy(room_id);

-- Create therapy_customer junction table
create table if not exists core.therapy_customer
(
  id char(27) default core.ksuid() not null primary key,

  therapy_id char(27) not null references core.therapy(id) on delete cascade deferrable initially deferred,
  customer_id char(27) not null references core.customer(id) on delete cascade deferrable initially deferred,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,

  constraint therapy_customer_unique unique (therapy_id, customer_id)
);

-- Create indexes for therapy_customer junction table
create index if not exists idx_therapy_customer_therapy_id on core.therapy_customer(therapy_id);
create index if not exists idx_therapy_customer_customer_id on core.therapy_customer(customer_id);

-- Create session table
create table if not exists core.session
(
  id  char(27) default core.ksuid() not null primary key,

  therapy_id char(27) not null references core.therapy(id) on delete restrict deferrable initially deferred,
  therapist_id char(27) not null references core.therapist(id) on delete restrict deferrable initially deferred,
  room_id char(27) references core.room(id) on delete set null deferrable initially deferred,

  start_datetime bigint not null,
  end_datetime bigint not null,

  price decimal not null,

  paid_at bigint,
  payment_type text,

  cancelled_at bigint,
  cancellation_reason text,

  therapy_session_frequency_ref text,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint session_datetime_check check (end_datetime > start_datetime)
);

-- Create indexes for session table
create index if not exists idx_session_therapy_id on core.session(therapy_id);
create index if not exists idx_session_therapist_id on core.session(therapist_id);
create index if not exists idx_session_datetime_range on core.session(start_datetime, end_datetime);
create index if not exists idx_session_cancelled_at on core.session(cancelled_at) where cancelled_at is not null;
create index if not exists idx_session_paid_at on core.session(paid_at) where paid_at is not null;
create index if not exists idx_session_room_id on core.session(room_id);
create index if not exists idx_session_therapy_session_frequency_ref on core.session(therapy_session_frequency_ref) where therapy_session_frequency_ref is not null;
create index if not exists idx_session_financial_dashboard on core.session(start_datetime, cancelled_at, deleted_at) where deleted_at is null;

-- Create session_customer junction table
create table if not exists core.session_customer
(
  id char(27) default core.ksuid() not null primary key,

  session_id char(27) not null references core.session(id) on delete cascade deferrable initially deferred,
  customer_id char(27) not null references core.customer(id) on delete cascade deferrable initially deferred,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,

  constraint session_customer_unique unique (session_id, customer_id)
);

-- Create indexes for session_customer junction table
create index if not exists idx_session_customer_session_id on core.session_customer(session_id);
create index if not exists idx_session_customer_customer_id on core.session_customer(customer_id);

-- Enable RLS for therapy table
alter table core.therapy enable row level security;
alter table core.therapy force row level security;

create policy therapy_select_policy on core.therapy
    for select
    using (
        core.can_access('Therapy', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_access('Therapy', 1))
    );

create policy therapy_insert_policy on core.therapy
    for insert
    with check (
        core.can_create('Therapy', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_create('Therapy', 1))
    );

create policy therapy_update_policy on core.therapy
    for update
    using (
        core.can_update('Therapy', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Therapy', 1))
    )
    with check (
        core.can_update('Therapy', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Therapy', 1))
    );

create policy therapy_delete_policy on core.therapy
    for delete
    using (
        core.can_delete('Therapy', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('Therapy', 1))
    );

-- Enable RLS for therapy_customer junction table
alter table core.therapy_customer enable row level security;
alter table core.therapy_customer force row level security;

create policy therapy_customer_select_policy on core.therapy_customer
    for select
    using (
        core.can_access('Therapy', 2)
        or exists (
            select 1 from core.therapy
            where therapy.id = therapy_customer.therapy_id
            and therapy.therapist_id = core.current_user_therapist_id()
            and core.can_access('Therapy', 1)
        )
    );

create policy therapy_customer_insert_policy on core.therapy_customer
    for insert
    with check (
        core.can_create('Therapy', 2)
        or exists (
            select 1 from core.therapy
            where therapy.id = therapy_customer.therapy_id
            and therapy.therapist_id = core.current_user_therapist_id()
            and core.can_create('Therapy', 1)
        )
    );

create policy therapy_customer_update_policy on core.therapy_customer
    for update
    using (
        core.can_update('Therapy', 2)
        or exists (
            select 1 from core.therapy
            where therapy.id = therapy_customer.therapy_id
            and therapy.therapist_id = core.current_user_therapist_id()
            and core.can_update('Therapy', 1)
        )
    )
    with check (
        core.can_update('Therapy', 2)
        or exists (
            select 1 from core.therapy
            where therapy.id = therapy_customer.therapy_id
            and therapy.therapist_id = core.current_user_therapist_id()
            and core.can_update('Therapy', 1)
        )
    );

create policy therapy_customer_delete_policy on core.therapy_customer
    for delete
    using (
        core.can_delete('Therapy', 2)
        or exists (
            select 1 from core.therapy
            where therapy.id = therapy_customer.therapy_id
            and therapy.therapist_id = core.current_user_therapist_id()
            and core.can_delete('Therapy', 1)
        )
    );

-- Enable RLS for session table
alter table core.session enable row level security;
alter table core.session force row level security;

create policy session_select_policy on core.session
    for select
    using (
        core.can_access('Session', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_access('Session', 1))
    );

create policy session_insert_policy on core.session
    for insert
    with check (
        core.can_create('Session', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_create('Session', 1))
    );

create policy session_update_policy on core.session
    for update
    using (
        core.can_update('Session', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Session', 1))
    )
    with check (
        core.can_update('Session', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_update('Session', 1))
    );

create policy session_delete_policy on core.session
    for delete
    using (
        core.can_delete('Session', 2)
        or (therapist_id = core.current_user_therapist_id() and core.can_delete('Session', 1))
    );

-- Enable RLS for session_customer junction table
alter table core.session_customer enable row level security;
alter table core.session_customer force row level security;

create policy session_customer_select_policy on core.session_customer
    for select
    using (
        core.can_access('Session', 2)
        or exists (
            select 1 from core.session
            where session.id = session_customer.session_id
            and session.therapist_id = core.current_user_therapist_id()
            and core.can_access('Session', 1)
        )
    );

create policy session_customer_insert_policy on core.session_customer
    for insert
    with check (
        core.can_create('Session', 2)
        or exists (
            select 1 from core.session
            where session.id = session_customer.session_id
            and session.therapist_id = core.current_user_therapist_id()
            and core.can_create('Session', 1)
        )
    );

create policy session_customer_update_policy on core.session_customer
    for update
    using (
        core.can_update('Session', 2)
        or exists (
            select 1 from core.session
            where session.id = session_customer.session_id
            and session.therapist_id = core.current_user_therapist_id()
            and core.can_update('Session', 1)
        )
    )
    with check (
        core.can_update('Session', 2)
        or exists (
            select 1 from core.session
            where session.id = session_customer.session_id
            and session.therapist_id = core.current_user_therapist_id()
            and core.can_update('Session', 1)
        )
    );

create policy session_customer_delete_policy on core.session_customer
    for delete
    using (
        core.can_delete('Session', 2)
        or exists (
            select 1 from core.session
            where session.id = session_customer.session_id
            and session.therapist_id = core.current_user_therapist_id()
            and core.can_delete('Session', 1)
        )
    );

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Drop session_customer policies
drop policy if exists session_customer_delete_policy on core.session_customer;
drop policy if exists session_customer_update_policy on core.session_customer;
drop policy if exists session_customer_insert_policy on core.session_customer;
drop policy if exists session_customer_select_policy on core.session_customer;
alter table core.session_customer disable row level security;
alter table core.session_customer no force row level security;

-- Drop session policies
drop policy if exists session_delete_policy on core.session;
drop policy if exists session_update_policy on core.session;
drop policy if exists session_insert_policy on core.session;
drop policy if exists session_select_policy on core.session;
alter table core.session disable row level security;
alter table core.session no force row level security;

-- Drop therapy_customer policies
drop policy if exists therapy_customer_delete_policy on core.therapy_customer;
drop policy if exists therapy_customer_update_policy on core.therapy_customer;
drop policy if exists therapy_customer_insert_policy on core.therapy_customer;
drop policy if exists therapy_customer_select_policy on core.therapy_customer;
alter table core.therapy_customer disable row level security;
alter table core.therapy_customer no force row level security;

-- Drop therapy policies
drop policy if exists therapy_delete_policy on core.therapy;
drop policy if exists therapy_update_policy on core.therapy;
drop policy if exists therapy_insert_policy on core.therapy;
drop policy if exists therapy_select_policy on core.therapy;
alter table core.therapy disable row level security;
alter table core.therapy no force row level security;
drop table if exists core.session_customer;
drop table if exists core.session;
drop table if exists core.therapy_customer;
drop table if exists core.therapy;
-- +goose StatementEnd
