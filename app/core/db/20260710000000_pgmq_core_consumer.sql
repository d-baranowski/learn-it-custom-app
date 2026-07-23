-- +goose Up
-- +goose StatementBegin
SELECT pgmq.create('core_incoming_events');
SELECT pgmq.bind_topic('payment.received', 'core_incoming_events');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT pgmq.detach_archive('core_incoming_events');
SELECT pgmq.drop_queue('core_incoming_events');
-- +goose StatementEnd
