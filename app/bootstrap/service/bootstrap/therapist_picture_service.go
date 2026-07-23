package bootstrap

import (
	"context"
	_ "embed"

	"go.uber.org/zap"
)

//go:embed therapist_pictures.sql
var therapistPictureSQL string

func (s *service) therapistPictureService(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, therapistPictureSQL)
	if err != nil {
		s.log.Error("failed to execute therapist_pictures SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert therapist pictures")
	return nil
}
