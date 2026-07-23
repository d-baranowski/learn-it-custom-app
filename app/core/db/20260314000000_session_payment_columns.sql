-- +goose Up
-- +goose StatementBegin
alter table core.session
  add column if not exists payment_link text,
  add column if not exists payment_status text;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.session
  drop column if exists payment_link,
  drop column if exists payment_status;
-- +goose StatementEnd

