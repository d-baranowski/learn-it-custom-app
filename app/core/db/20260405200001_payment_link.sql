-- +goose Up
-- +goose StatementBegin
create schema if not exists payment;

create table if not exists payment.payment_link
(
  id char(27) default core.ksuid() not null primary key,
  provider text not null,
  status text not null,
  url text,
  error_message text,
  amount decimal not null,
  currency text not null,
  description text not null,
  provider_reference text,
  attempt_count integer not null default 0,
  last_attempt_at bigint,
  next_attempt_at bigint,
  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text,

  constraint payment_payment_link_status_check check (status in ('PENDING', 'READY', 'FAILED'))
);

create index if not exists idx_payment_link_status_next_attempt
  on payment.payment_link(status, next_attempt_at)
  where deleted_at is null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists payment.payment_link;
drop schema if exists payment;
-- +goose StatementEnd
