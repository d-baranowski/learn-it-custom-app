-- +goose Up
-- +goose StatementBegin
create table if not exists core."issues_and_suggestions"
(
  id                      char(27) default core.ksuid() not null
    primary key,

  title                   text                          not null,
  description             text,
  status                  text                          not null default 'open',
  comments                jsonb                         not null default '[]'::jsonb,

  created_at              bigint                        not null,
  created_by              text                          not null,
  updated_at              bigint,
  updated_by              text,
  deleted_at              bigint,
  deleted_by              text
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists core."issues_and_suggestions";
-- +goose StatementEnd
