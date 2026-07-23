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

type SingularReadBuilderFunc[M, REQ, RESP any] func(q *bun.SelectQuery, id string, extra *ExtraInfoReq[REQ]) (*bun.SelectQuery, error)
type SingularReadPostHookFunc[M, REQ, RESP any] func(ctx context.Context, id string, result *M, extra *ExtraInfoReqResp[REQ, RESP]) error

type MultiReadBuilderFunc[M, REQ, RESP any] func(q *bun.SelectQuery, extra *ExtraInfoReq[REQ]) (*bun.SelectQuery, error)
type MultiReadPostHookFunc[M, REQ, RESP any] func(ctx context.Context, result []*M, extra *ExtraInfoReqResp[REQ, RESP]) error

type MutationPreHookFunc[M, REQ any] func(ctx context.Context, tx bun.Tx, input *M, extra *ExtraInfoReq[REQ]) error
type MutationPostHookFunc[M, REQ, RESP any] func(ctx context.Context, tx bun.Tx, result *M, extra *ExtraInfoReqResp[REQ, RESP]) error

type DeletePostHookFunc[M any] func(ctx context.Context, tx bun.Tx, result []*M, extra *ExtraInfoReqResp[requestv1.DeleteRequest, requestv1.DeleteResponse]) error

type ManualQueryFunc[M, REQ any] func(ctx context.Context, input *M, extra *ExtraInfoReq[REQ]) error
