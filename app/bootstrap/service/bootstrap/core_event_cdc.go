package bootstrap

import (
	"context"
	_ "embed"

	"go.uber.org/zap"
)

//go:embed core_event_cdc.sql
var coreEventCdc string

func (s *service) coreEventCdc(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, coreEventCdc)
	if err != nil {
		s.log.Error("failed to execute core-event CDC SQL", zap.Error(err))
		return err
	}

	s.log.Info("Restored core-event publication membership and replica identity")
	return nil
}
