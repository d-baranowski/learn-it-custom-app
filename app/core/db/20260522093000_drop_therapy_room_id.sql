-- +goose Up
-- +goose StatementBegin
with frequency_rows as (
  select
    t.id,
    t.room_id,
    f.entry,
    f.ord
  from core.therapy t
  cross join lateral jsonb_array_elements(
    coalesce(t.session_frequency, '[]'::jsonb)
  ) with ordinality as f(entry, ord)
  where t.room_id is not null
),
patched as (
  select
    fr.id,
    jsonb_agg(
      case
        when coalesce((fr.entry->>'isOnline')::boolean, false) = false
             and coalesce(fr.entry->>'roomId', '') = ''
        then jsonb_set(fr.entry, '{roomId}', to_jsonb(fr.room_id::text), true)
        else fr.entry
      end
      order by fr.ord
    ) as session_frequency
  from frequency_rows fr
  group by fr.id
)
update core.therapy t
set session_frequency = p.session_frequency
from patched p
where t.id = p.id;

drop index if exists core.idx_therapy_room_id;
drop index if exists core.idx_therapy_room_id_active;

alter table core.therapy
  drop column if exists room_id cascade;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core.therapy
  add column if not exists room_id char(27) references core.room(id) on delete set null deferrable initially deferred;

create index if not exists idx_therapy_room_id on core.therapy(room_id);
create index if not exists idx_therapy_room_id_active
  on core.therapy(room_id)
  where deleted_at is null;

with picked as (
  select
    t.id,
    (
      select entry->>'roomId'
      from jsonb_array_elements(coalesce(t.session_frequency, '[]'::jsonb)) as entry
      where coalesce((entry->>'isOnline')::boolean, false) = false
        and coalesce(entry->>'roomId', '') <> ''
      limit 1
    ) as room_id
  from core.therapy t
)
update core.therapy t
set room_id = picked.room_id
from picked
where t.id = picked.id
  and picked.room_id is not null
  and picked.room_id <> '';
-- +goose StatementEnd
