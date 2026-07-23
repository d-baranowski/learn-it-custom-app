-- +goose Up
-- +goose StatementBegin
create table if not exists core.country
(
  id               char(27) default core.ksuid() not null primary key,
  iso2             char(2),
  iso3             char(3),
  name             text                          not null,
  nationality_name text                          not null,
  timezone         text,
  created_at       bigint                        not null,
  created_by       text                          not null,
  updated_at       bigint,
  updated_by       text,
  deleted_at       bigint,
  deleted_by       text
);
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
drop table if exists core.country;
-- +goose StatementEnd
