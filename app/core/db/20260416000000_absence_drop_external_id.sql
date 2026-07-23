-- +goose Up
-- +goose StatementBegin
drop index if exists core.idx_absence_external_id_unique;
alter table core.absence drop column if exists external_id;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.absence add column external_id text;
create unique index if not exists idx_absence_external_id_unique on core.absence(external_id) where external_id is not null;
-- +goose StatementEnd
