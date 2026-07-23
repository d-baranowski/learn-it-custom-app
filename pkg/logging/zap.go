package logging

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/go-logr/zapr"
	"go.elastic.co/ecszap"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"k8s.io/klog/v2"
	"pkg/base"
	"pkg/tracing"
)

// openLogFile opens path for appending, creating it if needed. Callers own the
// returned closer.
func openLogFile(path string) (zapcore.WriteSyncer, io.Closer, error) {
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return nil, nil, err
	}
	return zapcore.Lock(zapcore.AddSync(f)), f, nil
}

// writeSyncer returns the destination for log output: stdout alone, or stdout
// plus Config.File when a log file is configured. If a configured LOG_FILE
// can't be opened it returns an error so startup fails loudly — a broken log
// mount must not silently degrade to losing the persisted logs.
func writeSyncer(cfg *Config, lc fx.Lifecycle) (zapcore.WriteSyncer, error) {
	stdout := zapcore.Lock(os.Stdout)
	if cfg.File == "" {
		return stdout, nil
	}

	fileSync, closer, err := openLogFile(cfg.File)
	if err != nil {
		return nil, fmt.Errorf("open LOG_FILE %q: %w", cfg.File, err)
	}
	lc.Append(fx.Hook{OnStop: func(context.Context) error { return closer.Close() }})

	return zapcore.NewMultiWriteSyncer(stdout, fileSync), nil
}

type ZapProviderProps struct {
	fx.In

	Config        *Config
	Name          *base.ServiceName
	Env           *base.ServiceEnv
	Ver           *base.ServiceVersion
	TracingConfig *tracing.Config `optional:"true"`
}

func ZapProvider(lc fx.Lifecycle, props ZapProviderProps) (*zap.Logger, error) {
	logLevel, err := zapcore.ParseLevel(props.Config.Level)
	if err != nil {
		return nil, fmt.Errorf("invalid LOG_LEVEL %q: %w", props.Config.Level, err)
	}

	ws, err := writeSyncer(props.Config, lc)
	if err != nil {
		return nil, err
	}

	if props.Config.TextFormat {
		encoderConfig := zap.NewDevelopmentEncoderConfig()
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder
		//encoderConfig.CallerKey = zapcore.OmitKey

		consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
		core := zapcore.NewCore(consoleEncoder, ws, logLevel)

		logger := zap.New(core, zap.AddCaller())

		klog.SetLogger(zapr.NewLogger(logger))

		zap.ReplaceGlobals(logger)

		//lc.Append(fx.Hook{
		//	OnStop: func(ctx context.Context) error {
		//		return logger.Sync()
		//	},
		//})

		return logger, nil
	}

	encoderConfig := ecszap.EncoderConfig{
		//EncodeName:     customNameEncoder,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeDuration: zapcore.MillisDurationEncoder,
		EncodeCaller:   ecszap.FullCallerEncoder,
	}
	core := ecszap.NewCore(encoderConfig, ws, logLevel)

	logger := zap.New(core, zap.AddCaller())

	if props.TracingConfig != nil && props.TracingConfig.DataDog {
		logger = logger.With(
			zap.String("dd.service", props.Name.String()),
			zap.String("dd.env", props.Env.String()),
			zap.String("dd.version", props.Ver.String()),
		)
	}

	zap.ReplaceGlobals(logger)

	//lc.Append(fx.Hook{
	//	OnStop: func(ctx context.Context) error {
	//		return logger.Sync()
	//	},
	//})

	return logger, nil
}
