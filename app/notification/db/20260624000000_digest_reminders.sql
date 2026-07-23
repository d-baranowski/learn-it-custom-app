-- +goose Up
-- +goose StatementBegin

ALTER TABLE notification.scheduled_reminder ADD COLUMN IF NOT EXISTS recipient_user_id TEXT;

UPDATE notification.scheduled_reminder
SET recipient_user_id = payload->>'therapist_user_id'
WHERE recipient_user_id IS NULL AND payload->>'therapist_user_id' IS NOT NULL;

-- Update seed template to digest format (list of sessions)
UPDATE notification.template_variant
SET subject = 'Unpaid session reminder — {{#sessions}}{{date}}{{/sessions}}',
    body = 'Hello {{therapist.fullName}},

You have unpaid sessions that need attention:

{{#sessions}}
• {{date}} at {{startAt}} — {{#customers}}{{fullName}}{{/customers}}
  Amount: {{amountDue}} {{currency}}{{#payment}}
  Pay: {{link}}{{/payment}}

{{/sessions}}'
WHERE id = 'seed_tmplv_unpaid_en_email';

UPDATE notification.template_variant
SET subject = 'Przypomnienie o nieopłaconych sesjach',
    body = 'Cześć {{therapist.fullName}},

Masz nieopłacone sesje wymagające uwagi:

{{#sessions}}
• {{date}} o {{startAt}} — {{#customers}}{{fullName}}{{/customers}}
  Kwota: {{amountDue}} {{currency}}{{#payment}}
  Zapłać: {{link}}{{/payment}}

{{/sessions}}'
WHERE id = 'seed_tmplv_unpaid_pl_email';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE notification.scheduled_reminder DROP COLUMN IF EXISTS recipient_user_id;
-- +goose StatementEnd
