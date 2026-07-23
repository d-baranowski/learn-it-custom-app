-- +goose Up
-- +goose StatementBegin
alter table core.session alter column therapy_id drop not null;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.session alter column therapy_id set not null;
-- +goose StatementEnd
