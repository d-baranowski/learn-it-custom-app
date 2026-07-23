package pgstore

import (
	"context"
	"errors"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

const (
	electionKeyPrefix = "rpg.election."
)

var (
	ErrElectionNoLeader = errors.New("election: no leader")
)

type Election interface {
	HasLeader(ctx context.Context) (bool, string, error)
	Leading() bool
	Leader() string
	Start(ctx context.Context)

	Join(id string, startLeading func(ctx context.Context), stopLeading func())
	Leave(id string)
}

type election struct {
	hostname       string
	lockName       string
	leader         string
	leading        bool
	db             *pgxpool.Pool
	ttl            int
	sessionID      string
	cancel         context.CancelFunc
	onStartLeading map[string]func(ctx context.Context)
	onStopLeading  map[string]func()
	mu             sync.RWMutex
	once           sync.Once
	log            *zap.Logger
}

func NewElection(db *pgxpool.Pool, lockName string, ttl int) (Election, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return nil, err
	}

	e := &election{
		hostname:       hostname,
		lockName:       electionKeyPrefix + lockName,
		db:             db,
		ttl:            ttl,
		onStartLeading: make(map[string]func(ctx context.Context)),
		onStopLeading:  make(map[string]func()),
		log:            zap.L().Named("pgstore-election"),
	}

	return e, nil
}

func (e *election) HasLeader(ctx context.Context) (bool, string, error) {
	var leader string
	var expiresAt time.Time

	err := e.db.QueryRow(ctx, `
		SELECT leader_id, expires_at
		FROM core.leader_election
		WHERE lock_name = $1 AND expires_at > NOW()
	`, e.lockName).Scan(&leader, &expiresAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, "", nil
		}
		return false, "", err
	}

	return true, leader, nil
}

func (e *election) Leading() bool {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.leading
}

func (e *election) Leader() string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.leader
}

func (e *election) Start(ctx context.Context) {
	e.once.Do(func() {
		campaignCtx, cancel := context.WithCancel(ctx)
		e.cancel = cancel

		go e.campaign(campaignCtx)
	})
}

func (e *election) campaign(ctx context.Context) {
	ticker := time.NewTicker(time.Duration(e.ttl/2) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			e.log.Info("election context canceled, stopping campaign")
			e.resign(context.Background())
			return
		case <-ticker.C:
			acquired, err := e.tryAcquireLeadership(ctx)
			if err != nil {
				e.log.Error("failed to acquire leadership", zap.Error(err))
				continue
			}

			wasLeading := e.Leading()

			if acquired && !wasLeading {
				e.mu.Lock()
				e.leading = true
				e.leader = e.hostname
				e.mu.Unlock()

				e.log.Info("started leading")

				for _, f := range e.onStartLeading {
					f(ctx)
				}
			} else if !acquired && wasLeading {
				e.mu.Lock()
				e.leading = false
				e.leader = ""
				e.mu.Unlock()

				e.log.Info("stopped leading")

				for _, f := range e.onStopLeading {
					f()
				}
			}
		}
	}
}

func (e *election) tryAcquireLeadership(ctx context.Context) (bool, error) {
	// First, clean up expired locks
	_, err := e.db.Exec(ctx, "SELECT cleanup_expired_locks()")
	if err != nil {
		e.log.Warn("failed to cleanup expired locks", zap.Error(err))
	}

	expiresAt := time.Now().Add(time.Duration(e.ttl) * time.Second)
	sessionID := e.hostname + "-" + time.Now().Format("20060102150405")

	// Try to insert or update the lock
	var currentLeader string
	err = e.db.QueryRow(ctx, `
		INSERT INTO core.leader_election (lock_name, leader_id, hostname, expires_at, session_id)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (lock_name) DO UPDATE SET
			leader_id = CASE
				WHEN leader_election.expires_at < NOW() OR leader_election.leader_id = $2 THEN $2
				ELSE leader_election.leader_id
			END,
			hostname = CASE
				WHEN leader_election.expires_at < NOW() OR leader_election.leader_id = $2 THEN $3
				ELSE leader_election.hostname
			END,
			expires_at = CASE
				WHEN leader_election.expires_at < NOW() OR leader_election.leader_id = $2 THEN $4
				ELSE leader_election.expires_at
			END,
			session_id = CASE
				WHEN leader_election.expires_at < NOW() OR leader_election.leader_id = $2 THEN $5
				ELSE leader_election.session_id
			END,
			acquired_at = CASE
				WHEN leader_election.expires_at < NOW() OR leader_election.leader_id = $2 THEN NOW()
				ELSE leader_election.acquired_at
			END
		RETURNING leader_id
	`, e.lockName, e.hostname, e.hostname, expiresAt, sessionID).Scan(&currentLeader)

	if err != nil {
		return false, err
	}

	e.sessionID = sessionID
	return currentLeader == e.hostname, nil
}

func (e *election) resign(ctx context.Context) {
	if !e.Leading() {
		return
	}

	_, err := e.db.Exec(ctx, `
		DELETE FROM core.leader_election
		WHERE lock_name = $1 AND leader_id = $2
	`, e.lockName, e.hostname)

	if err != nil {
		e.log.Error("failed to resign leadership", zap.Error(err))
	}

	e.mu.Lock()
	e.leading = false
	e.leader = ""
	e.mu.Unlock()

	e.log.Info("resigned from leadership")
}

func (e *election) Join(
	id string,
	startLeading func(ctx context.Context),
	stopLeading func()) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.onStartLeading[id] = startLeading
	e.onStopLeading[id] = stopLeading
}

func (e *election) Leave(id string) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.resign(context.Background())

	delete(e.onStartLeading, id)
	delete(e.onStopLeading, id)
}
