-- +goose Up
-- +goose StatementBegin
alter table core.session
  add column cancellation_actor smallint,
  add column cancelled_by_user_id text;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.session
  drop column cancellation_actor,
  drop column cancelled_by_user_id;
-- +goose StatementEnd
