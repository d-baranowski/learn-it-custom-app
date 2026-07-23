package rpc

import (
	"context"
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"pkg/rabbitmq"
	"pkg/tracing"
	"sync"
	"time"
)

type Request struct {
	Data     []byte    `json:"data"`
	Deadline time.Time `json:"deadline"`
}

type Response struct {
	Data  []byte `json:"result"`
	Error string `json:"error"`
}

type Client struct {
	id         string
	exchange   string
	routingKey string
	consumer   *rabbitmq.Consumer
	publisher  *rabbitmq.Publisher
	pending    sync.Map
	log        *zap.Logger
	tracer     *tracing.Tracer
}

type ClientProps struct {
	Name       string
	Exchange   string
	RoutingKey string
}

func NewClient(props ClientProps) (*Client, error) {
	c := &Client{
		id:         ksuid.New().String(),
		exchange:   props.Exchange,
		routingKey: props.RoutingKey,
		log:        zap.L().Named("rpc.client"),
		tracer:     tracing.NewTracer("rpc.client"),
	}

	publisher, err := rabbitmq.NewCPPublisher()
	if err != nil {
		c.log.Error("failed to create publisher", zap.Error(err))
		return nil, err
	}
	c.publisher = publisher

	consumer, err := rabbitmq.NewCPConsumer(
		func(d rabbitmq.Delivery) (action rabbitmq.Action) {
			correlationId := d.CorrelationId

			if ch, ok := c.pending.LoadAndDelete(correlationId); ok {
				responseChannel := ch.(chan Response)
				var response Response
				err = jsoniter.Unmarshal(d.Body, &response)
				if err != nil {
					c.log.Error("failed to unmarshal response", zap.Error(err))
					responseChannel <- Response{Error: fmt.Sprintf("failed to unmarshal response: %v", err)}
				} else {
					responseChannel <- response
				}
				close(responseChannel)
			}
			return 0
		},
		c.id,
	)
	if err != nil {
		c.log.Error("failed to create consumer", zap.Error(err))
		return nil, err
	}
	c.consumer = consumer

	return c, nil
}

func (c *Client) Call(ctx context.Context, headers map[string]interface{}, request Request) (<-chan Response, error) {
	corrId := ksuid.New().String()
	respChan := make(chan Response, 1)

	c.pending.Store(corrId, respChan)

	bytes, err := jsoniter.Marshal(request)
	if err != nil {
		c.log.Error("failed to marshal publish payload", zap.Error(err))
		return nil, err
	}

	if headers == nil {
		headers = rabbitmq.InjectAMQPHeaders(ctx)
	} else {
		_headers := rabbitmq.InjectAMQPHeaders(ctx)
		for k, v := range _headers {
			headers[k] = v
		}
	}

	err = c.publisher.PublishWithContext(
		ctx,
		bytes,
		[]string{c.routingKey},
		rabbitmq.WithPublishOptionsCorrelationID(corrId),
		rabbitmq.WithPublishOptionsHeaders(headers),
		rabbitmq.WithPublishOptionsContentType("application/json"),
		rabbitmq.WithPublishOptionsReplyTo(c.id),
		rabbitmq.WithPublishOptionsExchange(c.exchange),
	)
	if err != nil {
		return nil, err
	}

	go func() {
		select {
		case <-ctx.Done():
			if ch, ok := c.pending.LoadAndDelete(corrId); ok {
				responseChannel := ch.(chan Response)
				responseChannel <- Response{Error: "request timed out"}
				close(responseChannel)
			}
		case <-respChan: // if the response is already received, just exit
		}
	}()

	return respChan, nil
}
