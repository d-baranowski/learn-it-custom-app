package openai

type Config struct {
	ApiKey string `envconfig:"OPENAI_APIKEY" default:""`
}
