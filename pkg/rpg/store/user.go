package store

import (
	corev1 "app/core/gen/core/v1"
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/maps"
	"pkg/tracing"
)

type UserStore interface {
	Get(id string) (*corev1.User, bool)
	Set(ctx context.Context, m *corev1.User) error
}

type userStorePG struct {
	id     string
	db     *pgxpool.Pool
	store  *maps.SafeMap[string, *corev1.User]
	log    *zap.Logger
	tracer *tracing.Tracer
	ready  bool
	live   bool
	cancel context.CancelFunc
}

func NewUserStore(lc fx.Lifecycle, props StoreProps) (UserStore, error) {
	s := &userStorePG{
		db:     props.DB,
		store:  maps.NewSafeMap[string, *corev1.User](),
		log:    zap.L().Named("rpg-user-store"),
		tracer: tracing.NewTracer("rpg-user-store"),
		live:   true,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	props.HealthServer.AddService(s)

	return s, nil
}

func (s *userStorePG) Start(ctx context.Context) error {
	s.log.Info("starting user store")

	// Load initial data
	rows, err := s.db.Query(ctx, `SELECT user_id, user_data FROM core.user_store`)
	if err != nil {
		s.log.Error("failed to fetch users", zap.Error(err))
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		var userData []byte

		if err := rows.Scan(&userID, &userData); err != nil {
			s.log.Error("failed to scan user row", zap.Error(err))
			continue
		}

		var m *corev1.User
		if err := jsoniter.Unmarshal(userData, &m); err != nil {
			s.log.Error("failed to unmarshal user", zap.Error(err))
			continue
		}

		s.store.Set(m.Id, m)
	}

	// Start listening for changes
	listenCtx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	go s.listenForChanges(listenCtx)

	s.ready = true

	return nil
}

func (s *userStorePG) listenForChanges(ctx context.Context) {
	conn, err := s.db.Acquire(ctx)
	if err != nil {
		s.log.Error("failed to acquire connection for listener", zap.Error(err))
		return
	}
	defer conn.Release()

	_, err = conn.Exec(ctx, "LISTEN user_store_changes")
	if err != nil {
		s.log.Error("failed to listen to user_store_changes", zap.Error(err))
		return
	}

	for {
		select {
		case <-ctx.Done():
			return
		default:
			notification, err := conn.Conn().WaitForNotification(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				s.log.Error("error waiting for notification", zap.Error(err))
				continue
			}

			s.handleNotification(notification.Payload)
		}
	}
}

func (s *userStorePG) handleNotification(payload string) {
	var event struct {
		Operation string                 `json:"operation"`
		UserID    string                 `json:"user_id"`
		UserData  map[string]interface{} `json:"user_data"`
	}

	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		s.log.Error("failed to unmarshal notification", zap.Error(err))
		return
	}

	switch event.Operation {
	case "INSERT", "UPDATE":
		// Re-marshal and unmarshal to get proper type
		userData, err := json.Marshal(event.UserData)
		if err != nil {
			s.log.Error("failed to marshal user data", zap.Error(err))
			return
		}

		var m *corev1.User
		if err := jsoniter.Unmarshal(userData, &m); err != nil {
			s.log.Error("failed to unmarshal user", zap.Error(err))
			return
		}

		s.store.Set(m.Id, m)

	case "DELETE":
		s.store.Delete(event.UserID)
	}
}

func (s *userStorePG) Stop(_ context.Context) error {
	s.ready = false
	s.live = false

	if s.cancel != nil {
		s.cancel()
	}

	return nil
}

func (s *userStorePG) Get(id string) (*corev1.User, bool) {
	return s.store.Get(id)
}

func (s *userStorePG) Set(ctx context.Context, m *corev1.User) error {
	data, err := jsoniter.Marshal(m)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO core.user_store (user_id, user_data, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			user_data = $2,
			updated_at = NOW()
	`, m.Id, data)

	if err != nil {
		return err
	}

	return nil
}

func (s *userStorePG) LiveCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2000)
	defer cancel()

	return s.db.Ping(ctx)
}

func (s *userStorePG) ReadyCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2000)
	defer cancel()

	return s.db.Ping(ctx)
}
