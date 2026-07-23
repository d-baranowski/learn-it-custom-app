package wal

import (
	"context"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"pkg/cdc/event"
	"pkg/rabbitmq"
	"pkg/unix"
	"reflect"
)

var json = jsoniter.Config{
	EscapeHTML:                    false,
	MarshalFloatWith6Digits:       true,
	ObjectFieldMustBeSimpleString: true,
	TagKey:                        "db",
}.Froze()

type Client[T any] struct {
	id       string
	conn     *rabbitmq.Connection
	consumer *rabbitmq.Consumer
	handler  func(context.Context, *event.CdcEvent[T]) rabbitmq.Action
	schema   string
	table    string
	typ      reflect.Type
}

type ClientProps[T any] struct {
	Conn     *rabbitmq.Connection
	Schema   string
	Table    string
	Actions  []string
	Handler  func(context.Context, *event.CdcEvent[T]) rabbitmq.Action
	QueueTtl int
}

func NewClient[T any](ctx context.Context, props *ClientProps[T]) (*Client[T], error) {
	c := &Client[T]{
		id:      ksuid.New().String(),
		conn:    props.Conn,
		schema:  props.Schema,
		table:   props.Table,
		handler: props.Handler,
		typ:     reflect.TypeOf((*T)(nil)).Elem(),
	}

	queueTtl := props.QueueTtl
	if queueTtl == 0 {
		// 30 minutes = 1800000 ms
		// 1 minute = 60000 ms
		queueTtl = 60000
	}

	queueName := fmt.Sprintf("cdc.%s", c.id)

	consumerOptions := []func(*rabbitmq.ConsumerOptions){
		rabbitmq.WithConsumerOptionsExchangeDeclare,
		rabbitmq.WithConsumerOptionsExchangeDurable,
		rabbitmq.WithConsumerOptionsExchangeName(CdcExchange),
		rabbitmq.WithConsumerOptionsExchangeKind(rabbitmq.ExchangeTypeTopic),
		rabbitmq.WithConsumerOptionsConcurrency(1),
		rabbitmq.WithConsumerOptionsConsumerName(c.id),
		//rabbitmq.WithConsumerOptionsQueueAutoDelete,
		rabbitmq.WithConsumerOptionsQueueArgs(rabbitmq.Table{
			"x-expires": queueTtl,
		}),
	}
	if len(props.Actions) > 0 {
		for _, action := range props.Actions {
			if action == "ALL" {
				action = "*"
			}
			consumerOptions = append(consumerOptions, rabbitmq.WithConsumerOptionsRoutingKey(fmt.Sprintf("%s.%s.%s", c.schema, c.table, action)))
		}
	} else {
		consumerOptions = append(consumerOptions, rabbitmq.WithConsumerOptionsRoutingKey(fmt.Sprintf("%s.%s.*", c.schema, c.table)))
	}

	consumer, err := rabbitmq.NewConsumer(
		c.conn,
		func(d rabbitmq.Delivery) rabbitmq.Action {
			var payload Event
			if err := jsoniter.Unmarshal(d.Body, &payload); err != nil {
				zap.L().Error("failed to unmarshal wal event", zap.Error(err))
				return rabbitmq.NackDiscard
			}

			e := &event.CdcEvent[T]{
				Timestamp: unix.Now(),
				Schema:    c.schema,
				Table:     c.table,
				Action:    payload.Action,
				ID:        payload.ID,
				Old:       reflect.New(c.typ).Interface().(*T),
				New:       reflect.New(c.typ).Interface().(*T),
			}

			if payload.Old != nil {
				oldBytes, err := json.Marshal(payload.Old)
				if err != nil {
					zap.L().Error("failed to marshal old row", zap.Error(err))
					return rabbitmq.NackDiscard
				}

				if err := json.Unmarshal(oldBytes, &e.Old); err != nil {
					zap.L().Error("failed to unmarshal old row", zap.Error(err))
				}
			}

			if payload.New != nil {
				newBytes, err := json.Marshal(payload.New)
				if err != nil {
					zap.L().Error("failed to marshal new row", zap.Error(err))
					return rabbitmq.NackDiscard
				}

				if err := json.Unmarshal(newBytes, &e.New); err != nil {
					zap.L().Error("failed to unmarshal new row", zap.Error(err))
				}
			}

			zap.L().Debug("cdc event", zap.Any("event", e))

			return c.handler(ctx, e)
		},
		queueName,
		consumerOptions...,
	)
	if err != nil {
		zap.L().Error("failed to create consumer", zap.Error(err))
		return nil, err
	}

	c.consumer = consumer

	go func() {
		<-ctx.Done()
		c.consumer.Close()
	}()

	return c, nil
}
