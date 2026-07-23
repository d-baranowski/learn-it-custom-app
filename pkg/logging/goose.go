package logging

import "go.uber.org/zap"

type GooseLogger struct {
	logger *zap.SugaredLogger
}

func NewGooseLogger() *GooseLogger {
	sugar := zap.L().Sugar()
	return &GooseLogger{sugar}
}

func (l *GooseLogger) Fatalf(format string, v ...interface{}) {
	l.logger.Fatalf(format, v...)
}

func (l *GooseLogger) Printf(format string, v ...interface{}) {
	l.logger.Infof(format, v...)
}
