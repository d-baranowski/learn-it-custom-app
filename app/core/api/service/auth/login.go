package auth

import (
	authv1 "app/core/gen/core/auth/v1"
	sessionv1 "app/core/gen/core/session/v1"
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"database/sql"
	"errors"
	"pkg/api"
	"pkg/repository"
	"pkg/unix"
	"time"

	"connectrpc.com/connect"
	log "github.com/sirupsen/logrus"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

func (h *Service) Login(ctx context.Context, req *connect.Request[authv1.LoginRequest]) (*connect.Response[sessionv1.UserSession], error) {
	h.log.Debug("Login", zap.Any("headers", req.Header()), zap.Any("req", req.Msg))

	if err := h.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	user := model.User{}
	if req.Msg.UsingEmail {
		err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().Model(&user).Where("email = ?", req.Msg.Account).Limit(1).Scan(ctx)
		}, repository.RunExtraProps{SkipRLS: true})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				h.log.Info("User not found", zap.Any("email", req.Msg.Account))
				return nil, connect.NewError(connect.CodeNotFound, nil)
			}
			return nil, api.CommonApiErrorHandler(err)
		}
	} else {
		err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
			return tx.NewSelect().Model(&user).Where("username = ?", req.Msg.Account).Limit(1).Scan(ctx)
		}, repository.RunExtraProps{SkipRLS: true})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				h.log.Info("User not found", zap.Any("username", req.Msg.Account))
				return nil, connect.NewError(connect.CodeNotFound, nil)
			}
			return nil, api.CommonApiErrorHandler(err)
		}
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Msg.Password)); err != nil {
		log.WithError(err).Error("Password hash did not match")
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("password hash did not match"))
	}

	session := model.UserSession{
		UserId:    user.Id,
		Expires:   unix.Now().AddDuration(time.Hour * 24 * 7),
		CreatedAt: unix.Now(),
	}

	if err := h.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewInsert().Model(&session).Returning("*").Scan(ctx, &session)
	}, repository.RunExtraProps{SkipRLS: true}); err != nil {
		h.log.Error("Failed to create user session due to error", zap.Error(err))
		return nil, api.CommonApiErrorHandler(err)
	}

	res := connect.NewResponse(&sessionv1.UserSession{
		Id:     session.Id,
		UserId: user.Id,
		User: &corev1.User{
			Id:          user.Id,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			ExternalId:  user.ExternalId,
			Avatar:      user.Avatar,
			Disabled:    user.Disabled,
			ResetPass:   user.ResetPass,
		},
		CreatedAt: session.CreatedAt.Int64(),
		Expires:   session.Expires.Int64(),
	})

	res.Header().Set("Api-Version", "v1")

	return res, nil
}
