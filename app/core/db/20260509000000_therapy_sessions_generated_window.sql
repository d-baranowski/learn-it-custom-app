-- +goose Up
-- +goose StatementBegin
alter table core.therapy
  add column sessions_generated_at bigint,
  add column sessions_generated_till bigint;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.therapy
  drop column sessions_generated_at,
  drop column sessions_generated_till;
-- +goose StatementEnd
