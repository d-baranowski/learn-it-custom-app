-- +goose Up
-- +goose StatementBegin
alter table core.session
  add column if not exists payment_link_id char(27);

alter table core.session
  add constraint session_payment_link_id_fk
  foreign key (payment_link_id)
  references payment.payment_link(id)
  on delete set null
  deferrable initially deferred;

alter table core.session
  drop column if exists payment_link cascade,
  drop column if exists payment_status cascade;

drop table if exists core.payment_link cascade;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.session
  drop constraint if exists session_payment_link_id_fk;

alter table core.session
  drop column if exists payment_link_id,
  add column if not exists payment_link text,
  add column if not exists payment_status text;
-- +goose StatementEnd
