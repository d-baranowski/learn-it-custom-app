-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS payment;
DROP TABLE IF EXISTS payment.payment_link CASCADE;
CREATE TABLE payment.payment_link (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    provider        TEXT NOT NULL DEFAULT 'stripe',
    status          TEXT NOT NULL DEFAULT 'PENDING',
    url             TEXT,
    error_message   TEXT,
    amount          NUMERIC NOT NULL,
    currency        TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    provider_reference TEXT,
    attempt_count   INTEGER NOT NULL DEFAULT 0,
    last_attempt_at BIGINT,
    next_attempt_at BIGINT,
    created_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    created_by      TEXT NOT NULL DEFAULT '',
    updated_at      BIGINT,
    updated_by      TEXT,
    deleted_at      BIGINT,
    deleted_by      TEXT
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS payment.payment_link;
DROP SCHEMA IF EXISTS payment;
-- +goose StatementEnd
