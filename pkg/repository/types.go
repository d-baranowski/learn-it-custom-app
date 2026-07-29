package repository

import (
	"context"
	"github.com/uptrace/bun"
	requestv1 "pkg/request/gen/request/v1"
)

type ExtraInfoReqResp[REQ, RESP any] struct {
	Request  *REQ
	Response *RESP
	UserId   *string
}

type ExtraInfoReq[REQ any] struct {
	Request *REQ
	UserId  *string
}

// Read post-hooks receive the OPEN TRANSACTION, exactly as the mutation hooks
// below do, and must use it for any database work.
//
// They did not always. Until 2026-07-29 these signatures had no `tx`, so a hook
// that needed to query had no choice but to open a second transaction from the
// same pool — while the outer read transaction still held a connection. With
// MaxOpenConns=25, twenty-five concurrent Gets meant every connection was held
// by an outer transaction waiting for a twenty-sixth that could not exist. The
// pool deadlocked, `database/sql` waited on ctx.Done() with no deadline set,
// and staging's login hung for two hours.
// See infrastructure/INCIDENT-2026-07-29-db-pool-deadlock.md.
//
// Two rules follow, and neither is optional:
//   - Use the passed `tx`. Never call repository.Run, r.db.* or anything else
//     that acquires from the pool.
//   - Do no blocking I/O — no cross-service HTTP, no external calls. A pooled
//     database connection is held for the whole hook, so a slow dependency
//     becomes database exhaustion.
type SingularReadBuilderFunc[M, REQ, RESP any] func(q *bun.SelectQuery, id string, extra *ExtraInfoReq[REQ]) (*bun.SelectQuery, error)
type SingularReadPostHookFunc[M, REQ, RESP any] func(ctx context.Context, tx bun.Tx, id string, result *M, extra *ExtraInfoReqResp[REQ, RESP]) error

type MultiReadBuilderFunc[M, REQ, RESP any] func(q *bun.SelectQuery, extra *ExtraInfoReq[REQ]) (*bun.SelectQuery, error)
type MultiReadPostHookFunc[M, REQ, RESP any] func(ctx context.Context, tx bun.Tx, result []*M, extra *ExtraInfoReqResp[REQ, RESP]) error

type MutationPreHookFunc[M, REQ any] func(ctx context.Context, tx bun.Tx, input *M, extra *ExtraInfoReq[REQ]) error
type MutationPostHookFunc[M, REQ, RESP any] func(ctx context.Context, tx bun.Tx, result *M, extra *ExtraInfoReqResp[REQ, RESP]) error

type DeletePostHookFunc[M any] func(ctx context.Context, tx bun.Tx, result []*M, extra *ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error

type ManualQueryFunc[M, REQ any] func(ctx context.Context, input *M, extra *ExtraInfoReq[REQ]) error
