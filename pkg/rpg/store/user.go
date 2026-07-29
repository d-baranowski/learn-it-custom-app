package store

import (
	corev1 "app/core/gen/core/v1"
	"context"
	"encoding/json"
	"fmt"
	"time"

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
	backoff := newRetryBackoff(250*time.Millisecond, 10*time.Second)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		if err := s.listenOnce(ctx); err != nil {
			if ctx.Err() != nil {
				return
			}

			// The LISTEN connection can be closed (db restart/network hiccup).
			// Back off and reconnect — retrying on the same dead connection
			// only spins.
			s.log.Error("user_store_changes listener error; will reconnect", zap.Error(err))
			backoff.Sleep(ctx)
			continue
		}

		backoff.Reset()
	}
}

func (s *userStorePG) listenOnce(ctx context.Context) error {
	conn, err := s.db.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire connection for listener: %w", err)
	}
	defer conn.Release()

	// A LISTEN session is idle by design — it parks in WaitForNotification until
	// someone NOTIFYs — so the cluster-wide idle_session_timeout reaps it on a
	// timer and we lose every notification until the reconnect lands. Opt this
	// one session out, and reset before the connection goes back to the pool so
	// the exemption never rides along on a reused connection.
	if _, err := conn.Exec(ctx, "SET idle_session_timeout = 0"); err != nil {
		return fmt.Errorf("failed to disable idle_session_timeout on listener: %w", err)
	}
	defer func() {
		// Best effort: if the server already terminated the session this fails,
		// and pgx discards the connection rather than pooling it.
		if _, err := conn.Exec(context.WithoutCancel(ctx), "RESET idle_session_timeout"); err != nil {
			s.log.Debug("failed to reset idle_session_timeout on listener connection", zap.Error(err))
		}
	}()

	if _, err := conn.Exec(ctx, "LISTEN user_store_changes"); err != nil {
		return fmt.Errorf("failed to LISTEN user_store_changes: %w", err)
	}

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			notification, err := conn.Conn().WaitForNotification(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return nil
				}
				// Signal the outer loop to reconnect.
				return err
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
