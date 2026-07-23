package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed room.sql
var roomSQL string

func (s *service) rooms(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, roomSQL)
	if err != nil {
		s.log.Error("failed to execute room SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Inserted bootstrap rooms")
	return nil
}
