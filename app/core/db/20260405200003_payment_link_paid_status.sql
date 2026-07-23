-- +goose Up
-- +goose StatementBegin
alter table payment.payment_link
  drop constraint if exists payment_payment_link_status_check;

alter table payment.payment_link
  add constraint payment_payment_link_status_check
  check (status in ('PENDING', 'READY', 'FAILED', 'PAID'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table payment.payment_link
  drop constraint if exists payment_payment_link_status_check;

alter table payment.payment_link
  add constraint payment_payment_link_status_check
  check (status in ('PENDING', 'READY', 'FAILED'));
-- +goose StatementEnd
