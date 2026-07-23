package repository

type Config struct {
	Timezone string `envconfig:"TIMEZONE" default:"Asia/Ho_Chi_Minh"`
}
