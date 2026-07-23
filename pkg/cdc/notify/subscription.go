package notify

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
	jsoniter "github.com/json-iterator/go"
	"github.com/segmentio/ksuid"
	"go.uber.org/zap"
	"pkg/cdc/event"
	"pkg/unix"
	"reflect"
	"time"
)

type EChannel[T any] struct {
	ID       string
	Filter   func(*event.CdcEvent[T]) bool
	Mutate   func(*event.CdcEvent[T]) (*event.CdcEvent[T], error)
	Channel  chan *event.CdcEvent[T]
	channels map[string]chan *event.CdcEvent[T]
}

func (c *EChannel[T]) Close() {
	close(c.Channel)

	for _, ch := range c.channels {
		close(ch)
	}
}

type TChannel[T any, V any] struct {
	ID        string
	Filter    func(*event.CdcEvent[T]) bool
	Transform func(*event.CdcEvent[T]) (*event.CdcEvent[V], error)
	Channel   chan *event.CdcEvent[V]
	channels  map[string]chan *event.CdcEvent[V]
}

type Subscription[T any, V any] struct {
	ID        string
	Schema    string `json:"schema"`
	Table     string `json:"table"`
	When      *When  `json:"when"`
	EChannels map[string]*EChannel[T]
	TChannels map[string]*TChannel[T, V]
	ErrChan   chan error
	Type      reflect.Type
	cancel    bool
}

type SubscriptionProps[T any, V any] struct {
	CdcService *Service
	Schema     string
	Table      string
	When       *When
	EChannels  map[string]*EChannel[T]
	TChannels  map[string]*TChannel[T, V]
	ErrorChan  chan error
	Type       reflect.Type
}

func (p *SubscriptionProps[T, V]) Validate() error {
	if p.CdcService == nil {
		return errors.New("cdc service is required")
	}

	if len(p.Schema) == 0 {
		return errors.New("schema is required")
	}

	if len(p.Table) == 0 {
		return errors.New("table name is required")
	}

	if p.EChannels == nil && p.TChannels == nil {
		return errors.New("at least one event or transform channel must be provided")
	}

	if p.EChannels != nil {
		if len(p.EChannels) == 0 {
			return errors.New("event channels must be provided if set")
		}
		return nil
	}

	if p.TChannels != nil {
		if len(p.TChannels) == 0 {
			return errors.New("transform channels must be provided if set")
		}
		return nil
	}

	return nil
}

func NewSubscription[T any, V any](ctx context.Context, props SubscriptionProps[T, V]) (*Subscription[T, V], error) {
	err := props.Validate()
	if err != nil {
		return nil, err
	}

	for _, ch := range props.EChannels {
		if ch.ID == "" {
			ch.ID = ksuid.New().String()
		}
		ch.channels = make(map[string]chan *event.CdcEvent[T])
	}

	for _, ch := range props.TChannels {
		if ch.ID == "" {
			ch.ID = ksuid.New().String()
		}

		ch.channels = make(map[string]chan *event.CdcEvent[V])
	}

	sub := &Subscription[T, V]{
		ID:        ksuid.New().String(),
		Schema:    props.Schema,
		Table:     props.Table,
		When:      props.When,
		EChannels: props.EChannels,
		TChannels: props.TChannels,
		ErrChan:   props.ErrorChan,
		Type:      props.Type,
	}

	msgChan := make(chan *pgconn.Notification)

	if sub.When == nil {
		if err := props.CdcService.Subscribe(ctx, sub.ID, sub.Schema, sub.Table, msgChan); err != nil {
			return nil, err
		}
	} else {
		if err := props.CdcService.SubscribeWhen(ctx, sub.ID, sub.Schema, sub.Table, sub.When, msgChan); err != nil {
			return nil, err
		}
	}

	//jsoniter.RegisterTypeDecoderFunc("string", func(ptr unsafe.Pointer, iter *jsoniter.Iterator) {
	//	if iter.WhatIsNext() == jsoniter.NilValue {
	//		iter.Skip()
	//		*(*string)(ptr) = "" // Set the string field to an empty string if null is found
	//	} else {
	//		*(*string)(ptr) = iter.ReadString()
	//	}
	//})

	json := jsoniter.Config{TagKey: "db"}.Froze()

	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				//_ = props.CdcService.Unsubscribe(sub.Schema, sub.Table, sub.ID)
				return

			case msg := <-msgChan:
				if msg == nil {
					continue
				}

				e := &event.CdcEvent[T]{
					Timestamp: unix.Now(),
					Schema:    sub.Schema,
					Table:     sub.Table,
					Old:       reflect.New(sub.Type).Interface().(*T),
					New:       reflect.New(sub.Type).Interface().(*T),
				}
				if err := json.Unmarshal([]byte(msg.Payload), &e); err != nil {
					zap.L().Error("failed to unmarshal cdc event", zap.Error(err), zap.String("payload", msg.Payload))
					sub.ErrChan <- err
				}

				for _, ch := range sub.EChannels {
					if ch.Channel == nil {
						continue
					}

					if ch.Filter != nil {
						if !ch.Filter(e) {
							continue
						}
					}

					if ch.Mutate != nil {
						e, err = ch.Mutate(e)
						if err != nil {
							zap.L().Error("failed to mutate event", zap.Error(err), zap.Any("event", e))
							sub.ErrChan <- err
							continue
						}
					}

					ch.Channel <- e

					for _, cha := range ch.channels {
						cha <- e
					}
				}

				for _, ch := range sub.TChannels {
					if ch.Channel == nil {
						continue
					}

					if ch.Filter != nil {
						if !ch.Filter(e) {
							continue
						}
					}

					v, err := ch.Transform(e)
					if err != nil {
						zap.L().Error("failed to transform event", zap.Error(err), zap.Any("event", e))
						sub.ErrChan <- err
						continue
					}

					ch.Channel <- v

					for _, cha := range ch.channels {
						cha <- v
					}
				}

			case <-ticker.C:
				if sub.cancel {
					var err error
					if sub.When == nil {
						err = props.CdcService.Unsubscribe(ctx, sub.Schema, sub.Table, sub.ID)
					} else {
						err = props.CdcService.UnsubscribeWhen(ctx, sub.Schema, sub.Table, sub.When, sub.ID)
					}
					if err != nil {
						zap.L().With(zap.Error(err)).Error("failed to unsubscribe from cdc")
						sub.ErrChan <- err
					}
					return
				}
			}
		}
	}()

	return sub, nil
}

func (s *Subscription[T, V]) AddEChannel(ch *EChannel[T]) bool {
	if ch == nil {
		return false
	}
	if s.EChannels == nil {
		s.EChannels = make(map[string]*EChannel[T])
	}
	if ch.ID == "" {
		ch.ID = ksuid.New().String()
	} else if _, ok := s.EChannels[ch.ID]; ok {
		return false
	}

	s.EChannels[ch.ID] = ch
	return true
}

func (s *Subscription[T, V]) AddTChannel(ch *TChannel[T, V]) bool {
	if ch == nil {
		return false
	}
	if s.TChannels == nil {
		s.TChannels = make(map[string]*TChannel[T, V])
	}
	if ch.ID == "" {
		ch.ID = ksuid.New().String()
	} else if _, ok := s.TChannels[ch.ID]; ok {
		return false
	}

	s.TChannels[ch.ID] = ch
	return true
}

func (s *Subscription[T, V]) DeleteEChannel(id string) {
	delete(s.EChannels, id)
}

func (s *Subscription[T, V]) DeleteTChannel(id string) {
	delete(s.TChannels, id)
}

func (s *Subscription[T, V]) AddEChannelChan(eChanID, chID string, ch chan *event.CdcEvent[T]) bool {
	if ch == nil {
		return false
	}
	if s.EChannels == nil {
		return false
	}
	if _, ok := s.EChannels[eChanID]; ok {
		if s.EChannels[eChanID].channels == nil {
			s.EChannels[eChanID].channels = make(map[string]chan *event.CdcEvent[T])
		}

		s.EChannels[eChanID].channels[chID] = ch

		return true
	}
	return false
}

func (s *Subscription[T, V]) AddTChannelChan(tChanID, chID string, ch chan *event.CdcEvent[V]) bool {
	if ch == nil {
		return false
	}
	if s.TChannels == nil {
		return false
	}
	if _, ok := s.TChannels[tChanID]; ok {
		if s.TChannels[tChanID].channels == nil {
			s.TChannels[tChanID].channels = make(map[string]chan *event.CdcEvent[V])
		}

		s.TChannels[tChanID].channels[chID] = ch

		return true
	}
	return false
}

func (s *Subscription[T, V]) DeleteEChannelChan(eChanID, chID string) {
	if s.EChannels == nil {
		return
	}
	if _, ok := s.EChannels[eChanID]; ok {
		if s.EChannels[eChanID].channels == nil {
			return
		}
		delete(s.EChannels[eChanID].channels, chID)
	}
}

func (s *Subscription[T, V]) DeleteTChannelChan(tChanID, chID string) {
	if s.TChannels == nil {
		return
	}
	if _, ok := s.TChannels[tChanID]; ok {
		if s.TChannels[tChanID].channels == nil {
			return
		}
		delete(s.TChannels[tChanID].channels, chID)
	}
}

func (s *Subscription[T, V]) Cancel() {
	s.cancel = true
}

//type SubscriptionOption[T any, V any] func(s *Subscription[T, V]) (*Subscription[T, V], error)

//func WhenSubscriptionOption[T any, V any](clause string) SubscriptionOption[T, V] {
//	return func(s *Subscription[T, V]) (*Subscription[T, V], error) {
//		return s, nil
//	}
//}
