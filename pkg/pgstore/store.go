package pgstore

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	jsoniter "github.com/json-iterator/go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"pkg/health"
)

type Store interface {
	Put(ctx context.Context, key string, value interface{}) error
	PutProto(ctx context.Context, key string, msg proto.Message) error
	PutWithTTL(ctx context.Context, key string, value interface{}, ttl int64) error
	Delete(ctx context.Context, key string) error
}

type store struct {
	id         string
	db         *pgxpool.Pool
	leader     bool
	log        *zap.Logger
	tracer     trace.Tracer
	shutdowner fx.Shutdowner
}

type StoreProviderProps struct {
	fx.In

	DB           *pgxpool.Pool
	HealthServer *health.Server
	Log          *zap.Logger
	Shutdowner   fx.Shutdowner
}

func StoreProvider(lc fx.Lifecycle, props StoreProviderProps) (Store, error) {
	s, err := newStore(StoreProps{
		DB:  props.DB,
		Log: props.Log,
	})
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			s.shutdowner = props.Shutdowner

			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	props.HealthServer.AddService(s)

	return s, err
}

type StoreProps struct {
	DB  *pgxpool.Pool
	Log *zap.Logger
}

func newStore(props StoreProps) (*store, error) {
	return &store{
		db:     props.DB,
		log:    props.Log.Named("pgstore-store"),
		tracer: otel.Tracer("pgstore-store"),
	}, nil
}

func (s *store) Start(_ context.Context) error {
	s.log.Info("starting store")

	return nil
}

func (s *store) Stop(_ context.Context) error {
	s.log.Info("stopping store")

	return nil
}

func (s *store) Put(ctx context.Context, key string, value interface{}) error {
	if !s.leader {
		return nil
	}

	bytes, err := jsoniter.Marshal(value)
	if err != nil {
		s.log.Error("failed to marshal value", zap.Error(err))
		return err
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO core.kv_store (key, value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET
			value = $2,
			updated_at = NOW()
	`, key, bytes)

	if err != nil {
		s.log.Error("failed to put key", zap.Error(err))
		return err
	}

	return nil
}

func (s *store) PutProto(ctx context.Context, key string, msg proto.Message) error {
	if !s.leader {
		return nil
	}

	bytes, err := protojson.Marshal(msg)
	if err != nil {
		s.log.Error("failed to marshal proto value", zap.Error(err))
		return err
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO core.kv_store (key, value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET
			value = $2,
			updated_at = NOW()
	`, key, bytes)

	if err != nil {
		s.log.Error("failed to put proto key", zap.Error(err))
		return err
	}

	return nil
}

func (s *store) PutWithTTL(ctx context.Context, key string, value interface{}, ttl int64) error {
	if !s.leader {
		return nil
	}

	bytes, err := jsoniter.Marshal(value)
	if err != nil {
		s.log.Error("failed to marshal value", zap.Error(err))
		return err
	}

	expiresAt := time.Now().Add(time.Duration(ttl) * time.Second)

	_, err = s.db.Exec(ctx, `
		INSERT INTO kv_store (key, value, expires_at, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (key) DO UPDATE SET
			value = $2,
			expires_at = $3,
			updated_at = NOW()
	`, key, bytes, expiresAt)

	if err != nil {
		s.log.Error("failed to put key with ttl", zap.Error(err))
		return err
	}

	return nil
}

func (s *store) Delete(ctx context.Context, key string) error {
	if !s.leader {
		return nil
	}

	_, err := s.db.Exec(ctx, "DELETE FROM core.kv_store WHERE key = $1", key)
	if err != nil {
		s.log.Error("failed to delete key", zap.Error(err))
		return err
	}

	return nil
}

func (s *store) LiveCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return s.db.Ping(ctx)
}

func (s *store) ReadyCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return s.db.Ping(ctx)
}
