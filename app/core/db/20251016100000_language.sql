-- +goose Up
-- +goose StatementBegin
create table if not exists core."language"
(
  id           char(27) default core.ksuid() not null
    primary key,

  name         jsonb                         not null,
  iso_code     text                          not null unique,

  created_at   bigint                        not null,
  created_by   text                          not null,
  updated_at   bigint,
  updated_by   text,
  deleted_at   bigint,
  deleted_by   text
);

create index if not exists language_iso_code_idx on core."language"(iso_code);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists core.language;
-- +goose StatementEnd
