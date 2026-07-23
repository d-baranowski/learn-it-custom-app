package me

import (
	mev1 "app/core/gen/core/me/v1"
	"context"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *Service) GetPermissions(ctx context.Context, req *connect.Request[emptypb.Empty]) (*connect.Response[mev1.GetPermissionsResponse], error) {
	h.log.Debug("GetPermissions", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	userID, _ := ctxHelpers.GetContextUserID(ctx)

	resp := &mev1.GetPermissionsResponse{
		Groups: make(map[string]*mev1.GetPermissionsResponse_Group),
	}

	perms, ok := h.permissions.GetUserPermissions(ctx, userID)
	if !ok {
		return connect.NewResponse(resp), nil
	}

	for group, abilities := range perms {
		resp.Groups[group] = &mev1.GetPermissionsResponse_Group{
			Abilities: abilities,
		}
	}

	enforce := h.permissions.GetEnforce()
	resp.Enforce = &enforce
	return connect.NewResponse(resp), nil
}

func (h *Service) CheckPermission(ctx context.Context, req *connect.Request[mev1.CheckPermissionRequest]) (*connect.Response[mev1.CheckPermissionResponse], error) {
	h.log.Debug("CheckPermissions", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	userID, ok := ctxHelpers.GetContextUserID(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	allowed := h.permissions.CheckUserPermissions(ctx, userID, req.Msg.Group, req.Msg.Ability)

	return connect.NewResponse(&mev1.CheckPermissionResponse{Allowed: allowed}), nil
}
