package pgmq

import (
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("pgmq",
	fx.Provide(ProvideConsumer),
)

func ProvidePublisher(publisherID string) func(*zap.Logger) Publisher {
	return func(log *zap.Logger) Publisher {
		return NewPublisher(publisherID, log)
	}
}

func ProvideConsumer(db *bun.DB, log *zap.Logger) Consumer {
	return NewConsumer(db, log)
}
