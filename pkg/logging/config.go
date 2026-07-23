package logging

type Config struct {
	Level      string `envconfig:"LOG_LEVEL" default:"info"`
	TextFormat bool   `envconfig:"LOG_TEXT_FORMAT" default:"false"`
	// File, when set, mirrors logs to this path in addition to stdout. Used by
	// the e2e stack to persist per-service logs onto a bind-mounted host
	// directory that survives container teardown. Empty (the default) keeps
	// stdout-only behaviour for normal deployments.
	File string `envconfig:"LOG_FILE" default:""`
}
