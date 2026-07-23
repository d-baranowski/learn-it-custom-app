package wal

import (
	"context"
	"errors"
	"github.com/jackc/pglogrepl"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgproto3"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"time"
)

type Repository struct {
	conn   *pgx.Conn
	pgConn *pgconn.PgConn
	log    *zap.Logger
}

type RepositoryProviderProps struct {
	fx.In

	PgxConn *pgx.Conn
	PgConn  *pgconn.PgConn
	Log     *zap.Logger
}

func RepositoryProvider(props RepositoryProviderProps) (*Repository, error) {
	return newRepository(RepositoryProps{
		Conn:   props.PgxConn,
		PgConn: props.PgConn,
		Log:    props.Log,
	})
}

type RepositoryProps struct {
	Conn   *pgx.Conn
	PgConn *pgconn.PgConn
	Log    *zap.Logger
}

func newRepository(props RepositoryProps) (*Repository, error) {
	return &Repository{
		conn:   props.Conn,
		pgConn: props.PgConn,
		log:    props.Log,
	}, nil
}

func (r *Repository) GetSlotLSN(ctx context.Context, slotName string) (string, error) {
	var restartLSNStr string

	//noinspection SqlResolve
	err := r.conn.QueryRow(ctx, "SELECT restart_lsn FROM pg_replication_slots WHERE slot_name=$1;", slotName).
		Scan(&restartLSNStr)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}

	return restartLSNStr, err
}

// CreatePublication create publication fo all.
func (r *Repository) CreatePublication(ctx context.Context, name string) error {
	_, err := r.conn.Exec(ctx, `CREATE PUBLICATION "`+name+`" FOR ALL TABLES`)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "42710" {
				return nil
			}
		}
	}

	return err
}

func (r *Repository) IdentifySystem(ctx context.Context) (pglogrepl.IdentifySystemResult, error) {
	ident, err := pglogrepl.IdentifySystem(ctx, r.pgConn)
	if err != nil {
		r.log.Error("failed to identify system", zap.Error(err))
		return pglogrepl.IdentifySystemResult{}, err
	}
	r.log.Debug("identified system", zap.Any("ident", ident))
	return ident, err
}

func (r *Repository) CreateReplicationSlot(ctx context.Context, slotName, outputPlugin string) (consistentPoint string, snapshotName string, err error) {
	res, err := pglogrepl.CreateReplicationSlot(ctx, r.pgConn, slotName, outputPlugin, pglogrepl.CreateReplicationSlotOptions{}) //Temporary: true
	if err != nil {
		r.log.Error("failed to create replication slot", zap.Error(err))
	}

	return res.ConsistentPoint, res.SnapshotName, err
}

func (r *Repository) DropReplicationSlot(ctx context.Context, slotName string) (err error) {
	err = pglogrepl.DropReplicationSlot(ctx, r.pgConn, slotName, pglogrepl.DropReplicationSlotOptions{})
	if err != nil {
		r.log.Error("failed to drop replication slot", zap.Error(err))
	}
	return err
}

func (r *Repository) StartReplication(ctx context.Context, slotName string, clientXLogPos pglogrepl.LSN, pluginArguments []string) (err error) {
	err = pglogrepl.StartReplication(ctx, r.pgConn, slotName, clientXLogPos, pglogrepl.StartReplicationOptions{PluginArgs: pluginArguments})
	if err != nil {
		r.log.Error("failed to start replication", zap.Error(err))
	}
	return err
}

func (r *Repository) WaitForReplicationMessage(ctx context.Context, timeout time.Time) (*pgproto3.CopyData, error) {
	ctx, cancel := context.WithDeadline(ctx, timeout)
	rawMsg, err := r.pgConn.ReceiveMessage(ctx)
	cancel()
	if err != nil {
		if pgconn.Timeout(err) {
			return nil, nil
		}
		r.log.Error("failed to receive message", zap.Error(err))
		return nil, err
	}

	if errMsg, ok := rawMsg.(*pgproto3.ErrorResponse); ok {
		r.log.Error("received error message", zap.String("message", errMsg.Message))
		return nil, errors.New(errMsg.Message)
	}

	msg, ok := rawMsg.(*pgproto3.CopyData)
	if !ok {
		r.log.Error("received unexpected message", zap.Any("message", msg))
		return nil, errors.New("received unexpected message")
	}

	return msg, nil
}

func (r *Repository) SendStandbyStatusUpdate(ctx context.Context, clientXLogPos pglogrepl.LSN) (err error) {
	err = pglogrepl.SendStandbyStatusUpdate(ctx, r.pgConn, pglogrepl.StandbyStatusUpdate{WALWritePosition: clientXLogPos})
	if err != nil {
		r.log.Error("failed to send standby status update", zap.Error(err))
	}

	//nextStandbyMessageDeadline = time.Now().Add(standbyMessageTimeout)

	return err
}

func (r *Repository) IsAlive() bool {
	if r.conn.IsClosed() {
		return false
	}
	return !r.pgConn.IsClosed()
}

func (r *Repository) Close() error {
	err := r.conn.Close(context.Background())
	if err != nil {
		r.log.Error("failed to close connection", zap.Error(err))
	}

	err = r.pgConn.Close(context.Background())
	if err != nil {
		r.log.Error("failed to close pg connection", zap.Error(err))
	}

	return err
}
