-- +goose Up
-- +goose StatementBegin
create table if not exists core."customer"
(
  id                      char(27) default core.ksuid() not null
    primary key,

  user_id                 char(27)
    references core."user" on delete set null deferrable initially deferred,

  first_name              text,
  last_name               text,
  address                 text,
  email                   text,
  phone_number            text,
  notes                   text,
  language_id     char(27)
    references core."language" on delete set null deferrable initially deferred,

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
drop table if exists core."customer";
-- +goose StatementEnd
