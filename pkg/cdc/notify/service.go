package notify

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	jsoniter "github.com/json-iterator/go"
	"github.com/pkg/errors"
	"github.com/segmentio/ksuid"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/database/postgres"
	"strings"
	"sync"
)

type Service struct {
	mtx           sync.RWMutex
	id            string
	conn          *pgx.Conn
	pool          *pgxpool.Pool
	subscriptions map[string]map[string]chan *pgconn.Notification
	log           *zap.Logger
}

func NewService(lc fx.Lifecycle, ctx context.Context, config *postgres.Config, log *zap.Logger) (*Service, error) {
	s := &Service{
		mtx:           sync.RWMutex{},
		id:            ksuid.New().String(),
		subscriptions: make(map[string]map[string]chan *pgconn.Notification),
		log:           log,
	}

	conf, err := pgxpool.ParseConfig(config.ConnectionString())
	if err != nil {
		log.Error("failed to parse postgres connection string", zap.Error(err))
		return nil, err
	}

	//pgxConf := &pgx.ConnConfig{
	//	Config: pgconn.Config{
	//		Host:     config.Host,
	//		Port:     config.Port,
	//		Database: config.DbName,
	//		User:     config.User,
	//		Password: config.Password,
	//	},
	//	tracer:                   nil,
	//	StatementCacheCapacity:   0,
	//	DescriptionCacheCapacity: 0,
	//	DefaultQueryExecMode:     0,
	//}

	//conf := &pgxpool.Config{
	//	ConnConfig: pgxConf,
	//}

	pool, err := pgxpool.NewWithConfig(ctx, conf)
	if err != nil {
		log.Error("failed to connect to postgres", zap.Error(err))
		return nil, err
	}

	s.pool = pool

	conn, err := pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}

	s.conn = conn.Conn()

	// This connection parks in WaitForNotification for the life of the service,
	// which reads as an idle session to Postgres — the cluster-wide
	// idle_session_timeout would reap it on a timer. It is a dedicated listener
	// connection that is never returned to the pool for reuse, so opting it out
	// wholesale is safe.
	if _, err = conn.Exec(ctx, "SET idle_session_timeout = 0"); err != nil {
		log.Error("failed to disable idle_session_timeout on cdc listener", zap.Error(err))
		return nil, err
	}

	_, err = conn.Exec(ctx, "listen cdc")
	if err != nil {
		log.Error("failed to listen to channel", zap.Error(err))
		return nil, err
	}

	cancelCtx, cancel := context.WithCancel(ctx)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			log.Info("cdc service starting")

			errChan := make(chan error)
			go s.errorHandler(cancelCtx, errChan)

			go func() {
				for {
					msg, err := s.conn.WaitForNotification(cancelCtx)
					if err != nil {
						if errors.Is(err, context.Canceled) {
							s.log.Info("cdc listener cancelled")
							err = s.conn.Close(ctx)
							if err != nil {
								s.log.Error("failed to close connection", zap.Error(err))
								errChan <- err
							}
							return
						}
						s.log.Error("failed to wait for notification", zap.Error(err))
						errChan <- err

						if s.conn.IsClosed() {
							s.log.Info("cdc listener closed")
							return
						}

						continue
					}

					var subject Subject
					err = jsoniter.Unmarshal([]byte(msg.Payload), &subject)
					if err != nil {
						s.log.Error("failed to unmarshal notification", zap.Error(err))
						errChan <- err
					}

					subKey := fmt.Sprintf("%s.%s", subject.Schema, subject.Table)

					s.mtx.RLock()
					if _, ok := s.subscriptions[subKey]; ok {
						for _, ch := range s.subscriptions[subKey] {
							ch <- msg
						}
					}
					s.mtx.RUnlock()
				}
			}()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			s.log.Info("cdc service stopping")
			cancel()
			s.Stop(ctx)
			s.log.Info("cdc service stopped")
			return nil
		},
	})

	return s, nil
}

func (s *Service) Start(_ context.Context) {}

func (s *Service) errorHandler(ctx context.Context, errChan chan error) {
	for {
		select {
		case <-ctx.Done():
			s.log.Info("cdc error handler stopped")
			return
		case err := <-errChan:
			s.log.Error("cdc error", zap.Error(err))
			// todo: determine if we should stop the service
		}
	}
}

func (s *Service) Stop(ctx context.Context) {
	for subKey, subs := range s.subscriptions {
		parts := strings.Split(subKey, ".")
		schema := parts[0]
		table := parts[1]

		for subID := range subs {
			s.log.Info("dropping trigger", zap.String("schema", schema), zap.String("table", table), zap.String("id", subID))

			_, err := s.pool.Exec(ctx, fmt.Sprintf(`
		drop trigger "cdc_%s"
			on %s.%s;`, subID, schema, table))
			if err != nil {
				s.log.Error("failed to drop trigger", zap.Error(err))
			}
		}

		// close channels
		//for _, ch := range subs {
		//	close(ch)
		//}
	}

	//s.pool.Close()

	// todo: shutdown is leaving orphaned go routines, most likely the subscriptions
	// 	if the user has not cancelled them via context
}

func (s *Service) Subscribe(ctx context.Context, id, schema, table string, msgChan chan *pgconn.Notification) error {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	subKey := fmt.Sprintf("%s.%s", schema, table)

	if _, ok := s.subscriptions[subKey]; !ok {
		s.subscriptions[subKey] = make(map[string]chan *pgconn.Notification)
	}

	if _, ok := s.subscriptions[subKey][id]; ok {
		return errors.New("subscription already exists")
	}

	stmt := fmt.Sprintf(`
				create or replace trigger "cdc_%s"
					after insert or update or delete
					on %s.%s
					for each row
				execute procedure %s.cdc_notify();`, id, schema, table, schema)

	_, err := s.pool.Exec(ctx, stmt)
	if err != nil {
		return err
	}

	s.subscriptions[subKey][id] = msgChan

	s.log.Info("cdc subscription created", zap.String("schema", schema), zap.String("table", table), zap.String("id", id))

	return nil
}

func (s *Service) SubscribeWhen(ctx context.Context, id, schema, table string, when *When, msgChan chan *pgconn.Notification) error {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	if when == nil {
		return s.Subscribe(ctx, id, schema, table, msgChan)
	}

	subKey := fmt.Sprintf("%s.%s", schema, table)

	if _, ok := s.subscriptions[subKey]; !ok {
		s.subscriptions[subKey] = make(map[string]chan *pgconn.Notification)
	}

	if when.InsertClause != "" {
		subID := fmt.Sprintf("%s_insert", id)

		if _, ok := s.subscriptions[subKey][subID]; ok {
			return errors.New("subscription already exists")
		}

		stmt := fmt.Sprintf(`
				create or replace trigger "cdc_%s"
					after insert
					on %s.%s
					for each row
				when (%s)
				execute procedure %s.cdc_notify();`, subID, schema, table, when.InsertClause, schema)

		_, err := s.pool.Exec(ctx, stmt)
		if err != nil {
			return err
		}

		s.subscriptions[subKey][subID] = msgChan
		s.log.Info("cdc subscription created", zap.String("schema", schema), zap.String("table", table), zap.String("id", subID))
	}

	if when.UpdateClause != "" {
		subID := fmt.Sprintf("%s_update", id)

		if _, ok := s.subscriptions[subKey][subID]; ok {
			return errors.New("subscription already exists")
		}

		stmt := fmt.Sprintf(`
				create or replace trigger "cdc_%s"
					after update
					on %s.%s
					for each row
				when (%s)
				execute procedure %s.cdc_notify();`, subID, schema, table, when.UpdateClause, schema)

		_, err := s.pool.Exec(ctx, stmt)
		if err != nil {
			return err
		}

		s.subscriptions[subKey][subID] = msgChan
		s.log.Info("cdc subscription created", zap.String("schema", schema), zap.String("table", table), zap.String("id", subID))
	}

	if when.DeleteClause != "" {
		subID := fmt.Sprintf("%s_delete", id)

		if _, ok := s.subscriptions[subKey][subID]; ok {
			return errors.New("subscription already exists")
		}

		stmt := fmt.Sprintf(`
				create or replace trigger "cdc_%s"
					after delete
					on %s.%s
					for each row
				when (%s)
				execute procedure %s.cdc_notify();`, subID, schema, table, when.DeleteClause, schema)

		_, err := s.pool.Exec(ctx, stmt)
		if err != nil {
			return err
		}

		s.subscriptions[subKey][subID] = msgChan
		s.log.Info("cdc subscription created", zap.String("schema", schema), zap.String("table", table), zap.String("id", subID))
	}

	return nil
}

func (s *Service) Unsubscribe(ctx context.Context, schema, table, id string) error {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	subKey := fmt.Sprintf("%s.%s", schema, table)

	if _, ok := s.subscriptions[subKey]; !ok {
		return nil
	}

	if _, ok := s.subscriptions[subKey][id]; !ok {
		return nil
	}

	delete(s.subscriptions[subKey], id)

	if len(s.subscriptions[subKey]) == 0 {
		triggerName := fmt.Sprintf("cdc_%s", id)

		stmt := fmt.Sprintf(`
		drop trigger "%s"
			on %s.%s;`, triggerName, schema, table)

		_, err := s.pool.Exec(ctx, stmt)
		if err != nil {
			if strings.Contains(err.Error(), "does not exist") {
				return nil
			}
			return err
		}
		delete(s.subscriptions, subKey)
	}

	return nil
}

func (s *Service) UnsubscribeWhen(ctx context.Context, schema, table string, when *When, id string) error {
	s.mtx.Lock()
	defer s.mtx.Unlock()

	if when.InsertClause != "" {
		if err := s.Unsubscribe(ctx, schema, table, fmt.Sprintf("%s_insert", id)); err != nil {
			return err
		}
	}

	if when.UpdateClause != "" {
		if err := s.Unsubscribe(ctx, schema, table, fmt.Sprintf("%s_update", id)); err != nil {
			return err
		}
	}

	if when.DeleteClause != "" {
		if err := s.Unsubscribe(ctx, schema, table, fmt.Sprintf("%s_delete", id)); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) LiveCheck() error {
	_, err := s.pool.Query(context.Background(), `SELECT 1;`)
	return err
}

func (s *Service) ReadyCheck() error {
	_, err := s.pool.Query(context.Background(), `SELECT 1;`)
	return err
}
