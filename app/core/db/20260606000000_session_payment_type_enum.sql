-- +goose Up
-- +goose StatementBegin

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.views
    WHERE table_schema = 'core'
      AND view_definition LIKE '%session.payment_type%'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.table_schema, r.table_name);
  END LOOP;
END $$;

ALTER TABLE core.session
  ALTER COLUMN payment_type TYPE smallint
  USING CASE
    WHEN payment_type IS NULL THEN NULL
    WHEN payment_type ~ '^\d+$' THEN payment_type::smallint
    WHEN lower(payment_type) IN ('cash', 'session_payment_type_cash') THEN 1
    WHEN lower(payment_type) IN ('bank_transfer', 'bank transfer', 'session_payment_type_bank_transfer') THEN 2
    WHEN lower(payment_type) IN ('payment_link', 'payment link', 'session_payment_type_payment_link') THEN 3
    WHEN lower(payment_type) IN ('card', 'session_payment_type_card') THEN 4
    WHEN lower(payment_type) IN ('insurance', 'session_payment_type_insurance') THEN 5
    ELSE NULL
  END;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE core.session
  ALTER COLUMN payment_type TYPE text
  USING CASE
    WHEN payment_type IS NULL THEN NULL
    WHEN payment_type = 1 THEN 'CASH'
    WHEN payment_type = 2 THEN 'BANK_TRANSFER'
    WHEN payment_type = 3 THEN 'PAYMENT_LINK'
    WHEN payment_type = 4 THEN 'CARD'
    WHEN payment_type = 5 THEN 'INSURANCE'
    ELSE NULL
  END;

-- +goose StatementEnd
