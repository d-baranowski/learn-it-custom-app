-- Move the reminder-cancel trigger from the payment integration event to the
-- session.paid domain event. payment.received is now consumed by core (which
-- stamps session.paid_at); notification reacts to the resulting session.paid.
-- +goose Up
-- +goose StatementBegin
SELECT pgmq.unbind_topic('payment.received', 'notification_incoming_events');
SELECT pgmq.bind_topic('session.paid', 'notification_incoming_events');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT pgmq.unbind_topic('session.paid', 'notification_incoming_events');
SELECT pgmq.bind_topic('payment.received', 'notification_incoming_events');
-- +goose StatementEnd
