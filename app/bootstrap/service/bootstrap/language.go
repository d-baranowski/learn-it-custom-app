package bootstrap

import (
	"context"
	_ "embed"
	"go.uber.org/zap"
)

//go:embed language.sql
var languageSQL string

func (s *service) languages(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, languageSQL)
	if err != nil {
		s.log.Error("failed to execute language SQL: %v", zap.Error(err))
		return err
	}

	s.log.Info("Insert language")
	return nil
}
