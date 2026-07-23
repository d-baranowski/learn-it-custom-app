package tracing

type Config struct {
	Enabled    bool    `envconfig:"TR_ENABLED" default:"false"`
	Endpoint   string  `envconfig:"TR_ENDPOINT" default:"localhost:4318"`
	Https      bool    `envconfig:"TR_HTTPS" default:"true"`
	SampleRate float64 `envconfig:"TR_SAMPLE_RATE" default:"1.0"`
	DataDog    bool    `envconfig:"TR_DATADOG" default:"false"`
	StdOut     bool    `envconfig:"TR_STDOUT" default:"false"`
}
