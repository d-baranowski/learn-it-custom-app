-- +goose Up
-- +goose StatementBegin
UPDATE core.permission
SET
  abilities = ARRAY(SELECT DISTINCT unnest(abilities || ARRAY['GetNextSession']::text[])),
  updated_at = 1780358400000,
  updated_by = '2imfnAVjkbfcwEos1LLLztn1vEP'
WHERE role_id = '3TherapistRole00XyZ123456'
  AND key = 'Session'
  AND scope = 1
  AND revoke = false
  AND deleted_at IS NULL;

SELECT core.materialise_user_permission();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
UPDATE core.permission
SET
  abilities = array_remove(abilities, 'GetNextSession'),
  updated_at = 1780358400000,
  updated_by = '2imfnAVjkbfcwEos1LLLztn1vEP'
WHERE role_id = '3TherapistRole00XyZ123456'
  AND key = 'Session'
  AND scope = 1
  AND revoke = false
  AND deleted_at IS NULL;

SELECT core.materialise_user_permission();
-- +goose StatementEnd
