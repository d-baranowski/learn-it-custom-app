package wal

import (
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/jackc/pglogrepl"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/cdc/event"
	"pkg/health"
	"pkg/pgstore"
	"sync"
	"time"
)

type Service struct {
	mu        sync.RWMutex
	id        string
	config    *Config
	plugin    *OutputPlugin
	election  pgstore.Election
	repo      *Repository
	publisher EventPublisher
	lsn       pglogrepl.LSN
	leader    bool
	log       *zap.Logger
	live      bool
	ready     bool
}

type ServiceProviderProps struct {
	fx.In

	Config       *Config
	Plugin       *OutputPlugin
	Repo         *Repository
	Publisher    EventPublisher
	Election     pgstore.Election
	HealthServer *health.Server
	Log          *zap.Logger
}

func ServiceProvider(lc fx.Lifecycle, props ServiceProviderProps) (*Service, error) {
	s, err := newService(ServiceProps{
		Config:    props.Config,
		Plugin:    props.Plugin,
		Repo:      props.Repo,
		Publisher: props.Publisher,
		Log:       props.Log,
	})
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			s.election = props.Election
			s.election.Join(s.id, s.leading, s.following)

			props.HealthServer.AddService(s)

			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	return s, nil
}

type ServiceProps struct {
	Config    *Config
	Plugin    *OutputPlugin
	Repo      *Repository
	Publisher EventPublisher
	Log       *zap.Logger
}

func newService(props ServiceProps) (*Service, error) {
	return &Service{
		id:        "wal",
		config:    props.Config,
		plugin:    props.Plugin,
		repo:      props.Repo,
		publisher: props.Publisher,
		log:       props.Log,
		live:      false,
	}, nil
}

func (s *Service) Start(ctx context.Context) error {
	return nil
}

func (s *Service) Stop(_ context.Context) error {
	s.leader = false
	s.election.Leave(s.id)

	return nil
}

func (s *Service) leading(ctx context.Context) {
	s.leader = true

	err := s.sync(ctx)
	if err != nil {
		s.log.Error("failed to sync", zap.Error(err))
		//s.Stop(ctx)
	}
}

func (s *Service) following() {
	s.leader = false
}

func (s *Service) sync(ctx context.Context) error {
	if err := s.repo.CreatePublication(ctx, s.config.PublicationName); err != nil {
		s.log.Error("failed to create publication", zap.Error(err),
			zap.String("publication_name", s.config.PublicationName))
	}

	slotIsExists, err := s.slotExists(ctx)
	if err != nil {
		return err
	}

	if !slotIsExists {
		consistentPoint, _, err := s.repo.CreateReplicationSlot(ctx, s.config.SlotName, s.config.OutputPlugin)
		if err != nil {
			s.log.Error("failed to create replication slot", zap.Error(err),
				zap.String("slot_name", s.config.SlotName),
				zap.String("output_plugin", s.config.OutputPlugin))
			return err
		}

		lsn, err := pglogrepl.ParseLSN(consistentPoint)
		if err != nil {
			return err
		}

		s.setLSN(lsn)

		s.log.Info("new slot created", zap.String("slot_name", s.config.SlotName))
	} else {
		s.log.Info("slot already exists, LSN updated", zap.String("slot_name", s.config.SlotName))
	}

	ident, err := s.repo.IdentifySystem(ctx)
	if err != nil {
		return err
	}

	clientXLogPos := ident.XLogPos
	standbyMessageTimeout := time.Second * 10
	nextStandbyMessageDeadline := time.Now().Add(standbyMessageTimeout)

	tx := NewTransaction()

	if err := s.repo.StartReplication(ctx, s.config.SlotName, s.getLSN(), s.plugin.Arguments); err != nil {
		return err
	}

	for {
		if err := ctx.Err(); err != nil {
			return nil
		}

		if !s.leader {
			return nil
		}

		if time.Now().After(nextStandbyMessageDeadline) {
			err := s.repo.SendStandbyStatusUpdate(ctx, clientXLogPos)
			if err != nil {
				s.log.Error("send standby status update failed", zap.Error(err))
			}
			nextStandbyMessageDeadline = time.Now().Add(standbyMessageTimeout)
		}

		msg, err := s.repo.WaitForReplicationMessage(ctx, nextStandbyMessageDeadline)
		if err != nil {
			if errors.Is(err, context.DeadlineExceeded) {
				continue
			}
			return err
		}

		if msg == nil || msg.Data == nil {
			continue
		}

		switch msg.Data[0] {

		case pglogrepl.PrimaryKeepaliveMessageByteID:
			pkm, err := pglogrepl.ParsePrimaryKeepaliveMessage(msg.Data[1:])
			if err != nil {
				s.log.Error("ParsePrimaryKeepaliveMessage failed", zap.Error(err))
				continue
			}

			s.log.Debug("primary keepalive message",
				zap.Any("server_wal_end", pkm.ServerWALEnd),
				zap.Time("server_time", pkm.ServerTime),
				zap.Bool("reply_requested", pkm.ReplyRequested))

			if pkm.ReplyRequested {
				nextStandbyMessageDeadline = time.Time{}
			}

		case pglogrepl.XLogDataByteID:
			xld, err := pglogrepl.ParseXLogData(msg.Data[1:])
			if err != nil {
				zap.L().Error("ParseXLogData failed", zap.Error(err))
				return err
			}

			//zap.L().Debug("XLogData",
			//	zap.Any("wal_start", xld.WALStart),
			//	zap.Any("server_wal_end", xld.ServerWALEnd),
			//	zap.Time("server_time", xld.ServerTime),
			//	zap.String("wal_data", hex.Dump(xld.WALData)))

			//var nextLsn = xld.WALStart + pglogrepl.LSN(len(xld.WALData))

			m, err := pglogrepl.Parse(xld.WALData)
			if err != nil {
				zap.L().Error("parse logical replication message failed", zap.Error(err))
				return err
			}

			zap.L().Debug("received logical replication message", zap.Any("type", m.Type()))

			switch lm := m.(type) {
			case *pglogrepl.RelationMessage:
				zap.L().Debug("processing relation type message",
					zap.Any("relation_id", lm.RelationID),
					zap.Any("replica", lm.ReplicaIdentity))

				//if tx.LSN == 0 {
				//	return fmt.Errorf("commit: %w", wal.errMessageLost)
				//}

				tx.Relations[lm.RelationID] = lm

			case *pglogrepl.BeginMessage:
				zap.L().Debug("processing begin type message", zap.Any("lsn", lm.FinalLSN),
					zap.Any("xid", lm.Xid))

				tx.LSN = lm.FinalLSN
				tx.BeginTime = &lm.CommitTime

			case *pglogrepl.CommitMessage:
				zap.L().Debug("processing commit type message", zap.Any("lsn", lm.CommitLSN),
					zap.Any("transaction_end_lsn", lm.TransactionEndLSN))

				//if tx.LSN > 0 && tx.LSN != lm.CommitLSN {
				//	return fmt.Errorf("commit: %w", errMessageLost)
				//}

				tx.CommitTime = &lm.CommitTime

				s.lsn = lm.TransactionEndLSN

			case *pglogrepl.InsertMessage:
				zap.L().Debug("processing insert type message", zap.Any("relation_id", lm.RelationID))

				action, err := tx.CreateActionData(
					lm.RelationID,
					nil,
					lm.Tuple,
					event.Insert,
				)
				if err != nil {
					return err
				}

				tx.Actions = append(tx.Actions, action)

			case *pglogrepl.UpdateMessage:
				zap.L().Debug("processing update type message", zap.Any("relation_id", lm.RelationID))

				action, err := tx.CreateActionData(
					lm.RelationID,
					lm.OldTuple,
					lm.NewTuple,
					event.Update,
				)
				if err != nil {
					return err
				}

				tx.Actions = append(tx.Actions, action)

			case *pglogrepl.DeleteMessage:
				zap.L().Debug("processing delete type message", zap.Any("relation_id", lm.RelationID))

				action, err := tx.CreateActionData(
					lm.RelationID,
					lm.OldTuple,
					nil,
					event.Delete,
				)
				if err != nil {
					return err
				}

				tx.Actions = append(tx.Actions, action)

			case *pglogrepl.TruncateMessage:
				zap.L().Debug("truncate type message was received")

			case *pglogrepl.TypeMessage:
				zap.L().Debug("type message was received")

			case *pglogrepl.OriginMessage:
				zap.L().Debug("origin type message was received")

			case *pglogrepl.LogicalDecodingMessage:
				zap.L().Debug("logical decoding message was received",
					zap.String("prefix", lm.Prefix),
					zap.String("content", hex.Dump(lm.Content)))

			default:
				zap.L().Error("unknown message type in pgoutput stream", zap.Any("type", lm.Type()))
			}

			if tx.CommitTime != nil {
				filter := s.publisher.Filter()
				events := tx.CreateEventsWithFilter(filter.Tables)

				for _, event := range events {
					if err = s.publisher.Publish(ctx, event); err != nil {
						//s.errChannel <- fmt.Errorf("publish message: %w", err)
						continue
					}
				}

				tx.Clear()
			}

			//if tx.LSN > s.getLSNAsInt64() {
			//	if err = s.ackWalMessage(msg.WalMessage.WalStart); err != nil {
			//		l.errChannel <- fmt.Errorf("acknowledge wal message: %w", err)
			//		continue
			//	}
			//
			//	l.log.WithField("lsn", l.getLSN()).Debugln("ack wal msg")
			//}

		default:
			s.log.Debug("Unknown message type", zap.Any("msg", msg))
			continue
		}

	}

}

func (s *Service) ackWalMessage(ctx context.Context, lsn pglogrepl.LSN) error {
	s.setLSN(lsn)

	if err := s.repo.SendStandbyStatusUpdate(ctx, lsn); err != nil {
		return err
	}

	return nil
}

func (s *Service) getLSN() pglogrepl.LSN {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.lsn
}

func (s *Service) getLSNAsInt64() int64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return int64(s.lsn)
}

func (s *Service) setLSN(lsn pglogrepl.LSN) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.lsn = lsn
}

func (s *Service) slotExists(ctx context.Context) (bool, error) {
	restartLSNStr, err := s.repo.GetSlotLSN(ctx, s.config.SlotName)
	if err != nil {
		return false, err
	}

	if len(restartLSNStr) == 0 {
		s.log.Info("existing slot not found", zap.String("slot_name", s.config.SlotName))
		return false, nil
	}

	lsn, err := pglogrepl.ParseLSN(restartLSNStr)
	if err != nil {
		return false, fmt.Errorf("parse lsn: %w", err)
	}

	s.setLSN(lsn)

	return true, nil
}

func (s *Service) LiveCheck() error {
	if !s.live || !s.repo.IsAlive() {
		return health.ErrNotLive
	}

	return nil
}

func (s *Service) ReadyCheck() error {
	if !s.ready || !s.repo.IsAlive() {
		return health.ErrNotReady
	}

	return nil
}
