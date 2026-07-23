-- +goose Up
-- +goose StatementBegin

-- Seed default session.unpaid notification template
INSERT INTO notification.template (id, event_type_key, title, description, active, created_at, created_by) VALUES
  ('seed_tmpl_session_unpaid_001', 'session.unpaid', 'Session Unpaid Reminder', 'Default template for unpaid session reminders sent to therapists', true, 1750521600000, 'system');

-- English email variant
INSERT INTO notification.template_variant (id, template_id, language, delivery_mechanism, subject, body, created_at, created_by) VALUES
  ('seed_tmplv_unpaid_en_email', 'seed_tmpl_session_unpaid_001', 'en', 1,
   'Unpaid session reminder - {{customer.fullName}} on {{session.date}}',
   'Hello {{therapist.fullName}},

This is a reminder that the session on {{session.date}} at {{session.startAt}} with {{customer.fullName}} has not been paid yet.

Amount due: {{session.amountDue}} {{session.currency}}

Payment link: {{payment.link}}',
   1750521600000, 'system');

-- Polish email variant
INSERT INTO notification.template_variant (id, template_id, language, delivery_mechanism, subject, body, created_at, created_by) VALUES
  ('seed_tmplv_unpaid_pl_email', 'seed_tmpl_session_unpaid_001', 'pl', 1,
   'Przypomnienie o nieopłaconej sesji - {{customer.fullName}} dnia {{session.date}}',
   'Cześć {{therapist.fullName}},

Przypominamy, że sesja w dniu {{session.date}} o godzinie {{session.startAt}} z {{customer.fullName}} nie została jeszcze opłacona.

Kwota do zapłaty: {{session.amountDue}} {{session.currency}}

Link do płatności: {{payment.link}}',
   1750521600000, 'system');

-- Seed default session.unpaid email preferences for all active therapist users
INSERT INTO notification.preference (user_id, event_type_key, delivery_mechanism, enabled, language, created_at, created_by)
SELECT
  t.user_id,
  'session.unpaid',
  1, -- EMAIL
  true,
  'en',
  1750521600000,
  'system'
FROM core.therapist t
WHERE t.user_id IS NOT NULL
  AND t.deleted_at IS NULL
ON CONFLICT (user_id, event_type_key, delivery_mechanism) WHERE deleted_at IS NULL DO NOTHING;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM notification.preference WHERE event_type_key = 'session.unpaid' AND created_by = 'system';
DELETE FROM notification.template_variant WHERE template_id = 'seed_tmpl_session_unpaid_001';
DELETE FROM notification.template WHERE id = 'seed_tmpl_session_unpaid_001';
-- +goose StatementEnd
