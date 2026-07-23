-- +goose Up
-- +goose StatementBegin
create table if not exists core."service"
(
  id             char(27) default core.ksuid() not null
    primary key,

  description    jsonb,
  name           jsonb,
  default_price  decimal,
  backdrop_photo text,
  hero_photo     text,

  created_at  bigint                        not null,
  created_by  text                          not null,
  updated_at  bigint,
  updated_by  text,
  deleted_at  bigint,
  deleted_by  text
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists core.service;
-- +goose StatementEnd
