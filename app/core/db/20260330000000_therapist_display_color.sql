-- +goose Up
-- +goose StatementBegin
alter table core.therapist
  add column if not exists display_color text default '#00F';

update core.therapist therapist
set display_color = "user".display_color
from core."user" "user"
where therapist.user_id = "user".id
  and "user".display_color is not null;

alter table core."user"
  drop column if exists display_color cascade;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table core."user"
  add column if not exists display_color text default '#00F';

update core."user" "user"
set display_color = therapist.display_color
from core.therapist therapist
where therapist.user_id = "user".id
  and therapist.display_color is not null;

--
-- alter table core.therapist
--   drop column if exists display_color;
-- +goose StatementEnd
