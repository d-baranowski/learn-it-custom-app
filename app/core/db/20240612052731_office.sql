-- +goose Up
-- +goose StatementBegin
create table if not exists core.office
(
  id  char(27) default core.ksuid() not null primary key,

  display_name jsonb not null,
  address text not null,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

create index if not exists idx_office_deleted_at on core.office(deleted_at) where deleted_at is null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists core.office;
-- +goose StatementEnd
