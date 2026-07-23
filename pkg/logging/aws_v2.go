package logging

import (
	"github.com/aws/smithy-go/logging"
	"go.uber.org/zap"
)

type AwsV2Logger struct {
	logger *zap.SugaredLogger
}

func NewAwsV2Logger() *AwsV2Logger {
	sugar := zap.L().Sugar()
	return &AwsV2Logger{sugar}
}

func (l *AwsV2Logger) Logf(classification logging.Classification, format string, v ...interface{}) {
	class := string(classification)
	switch class {
	case "DEBUG":
		l.logger.Debugf(format, v...)
	case "ERROR":
		l.logger.Errorf(format, v...)
	case "WARN":
		l.logger.Warnf(format, v...)
	default:
		l.logger.Infof(format, v...)
	}
}
