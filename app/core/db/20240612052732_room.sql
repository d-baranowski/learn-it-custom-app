-- +goose Up
-- +goose StatementBegin
create table if not exists core.room
(
  id  char(27) default core.ksuid() not null primary key,

  office_id char(27) not null references core.office(id) on delete restrict deferrable initially deferred,
  display_name jsonb not null,
  display_abbreviation text unique,
  display_color text default '#00F',
  description jsonb,

  created_at bigint not null,
  created_by text not null,
  updated_at bigint,
  updated_by text,
  deleted_at bigint,
  deleted_by text
);

create index if not exists idx_room_office_id on core.room(office_id);
create index if not exists idx_room_deleted_at on core.room(deleted_at) where deleted_at is null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists core.room;
-- +goose StatementEnd
