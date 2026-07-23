-- +goose Up
-- +goose StatementBegin

-- Create recurring_cashflow table
create table if not exists core.recurring_cashflow
(
  id  char(27) default core.ksuid() not null primary key,

  display_name text not null,
  amount numeric(15,2) not null,
  start_date bigint not null,
  end_date bigint,
  frequency jsonb default '[]'::jsonb,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint recurring_cashflow_end_date_check check (end_date is null or end_date > start_date)
);

create index if not exists idx_recurring_cashflow_deleted_at on core.recurring_cashflow(deleted_at) where deleted_at is null;
create index if not exists idx_recurring_cashflow_date_range on core.recurring_cashflow(start_date, end_date);

-- Create transaction table
create table if not exists core.transaction
(
  id  char(27) default core.ksuid() not null primary key,

  recurring_cashflow_id char(27) references core.recurring_cashflow(id) on delete restrict deferrable initially deferred,
  display_name text not null,
  amount numeric(15,2) not null,
  incurred_at bigint not null,

  recurring_cashflow_frequency_ref text,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

create index if not exists idx_transaction_deleted_at on core.transaction(deleted_at) where deleted_at is null;
create index if not exists idx_transaction_recurring_cashflow_id on core.transaction(recurring_cashflow_id);
create index if not exists idx_transaction_incurred_at on core.transaction(incurred_at);
create index if not exists idx_transaction_recurring_cashflow_frequency_ref on core.transaction(recurring_cashflow_frequency_ref) where recurring_cashflow_frequency_ref is not null;
create index if not exists idx_transaction_financial_dashboard on core.transaction(incurred_at, deleted_at) where deleted_at is null;

-- Enable RLS for recurring_cashflow table
alter table core.recurring_cashflow enable row level security;
alter table core.recurring_cashflow force row level security;

-- Create RLS policies for recurring_cashflow (scope: 2=ALL)
create policy recurring_cashflow_select_policy on core.recurring_cashflow
    for select
    using (core.can_access('RecurringCashflow', 2));

create policy recurring_cashflow_insert_policy on core.recurring_cashflow
    for insert
    with check (core.can_create('RecurringCashflow', 2));

create policy recurring_cashflow_update_policy on core.recurring_cashflow
    for update
    using (
        -- If updating deleted_at field, check for SoftDelete permission
        case 
            when deleted_at is distinct from (select rc.deleted_at from core.recurring_cashflow rc where rc.id = recurring_cashflow.id)
            then core.can_soft_delete('RecurringCashflow', 2)
            else core.can_update('RecurringCashflow', 2)
        end
    )
    with check (
        case 
            when deleted_at is distinct from (select rc.deleted_at from core.recurring_cashflow rc where rc.id = recurring_cashflow.id)
            then core.can_soft_delete('RecurringCashflow', 2)
            else core.can_update('RecurringCashflow', 2)
        end
    );

create policy recurring_cashflow_delete_policy on core.recurring_cashflow
    for delete
    using (core.can_delete('RecurringCashflow', 2));

-- Enable RLS for transaction table
alter table core.transaction enable row level security;
alter table core.transaction force row level security;

-- Create RLS policies for transaction (scope: 2=ALL)
create policy transaction_select_policy on core.transaction
    for select
    using (core.can_access('Transaction', 2));

create policy transaction_insert_policy on core.transaction
    for insert
    with check (core.can_create('Transaction', 2));

create policy transaction_update_policy on core.transaction
    for update
    using (
        -- If updating deleted_at field, check for SoftDelete permission
        case 
            when deleted_at is distinct from (select t.deleted_at from core.transaction t where t.id = transaction.id)
            then core.can_soft_delete('Transaction', 2)
            else core.can_update('Transaction', 2)
        end
    )
    with check (
        case 
            when deleted_at is distinct from (select t.deleted_at from core.transaction t where t.id = transaction.id)
            then core.can_soft_delete('Transaction', 2)
            else core.can_update('Transaction', 2)
        end
    );

create policy transaction_delete_policy on core.transaction
    for delete
    using (core.can_delete('Transaction', 2));

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Drop transaction policies
drop policy if exists transaction_delete_policy on core.transaction;
drop policy if exists transaction_update_policy on core.transaction;
drop policy if exists transaction_insert_policy on core.transaction;
drop policy if exists transaction_select_policy on core.transaction;
alter table core.transaction disable row level security;
alter table core.transaction no force row level security;
drop table if exists core.transaction;

-- Drop recurring_cashflow policies
drop policy if exists recurring_cashflow_delete_policy on core.recurring_cashflow;
drop policy if exists recurring_cashflow_update_policy on core.recurring_cashflow;
drop policy if exists recurring_cashflow_insert_policy on core.recurring_cashflow;
drop policy if exists recurring_cashflow_select_policy on core.recurring_cashflow;
alter table core.recurring_cashflow disable row level security;
alter table core.recurring_cashflow no force row level security;
drop table if exists core.recurring_cashflow;
-- +goose StatementEnd
