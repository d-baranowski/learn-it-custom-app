-- +goose Up
-- +goose StatementBegin
SELECT pgmq.create('notification_incoming_events');
SELECT pgmq.bind_topic('session.created', 'notification_incoming_events');
SELECT pgmq.bind_topic('session.updated', 'notification_incoming_events');
SELECT pgmq.bind_topic('session.cancelled', 'notification_incoming_events');
SELECT pgmq.bind_topic('payment.received', 'notification_incoming_events');
SELECT pgmq.bind_topic('therapist.created', 'notification_incoming_events');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT pgmq.detach_archive('notification_incoming_events');
SELECT pgmq.drop_queue('notification_incoming_events');
-- +goose StatementEnd
