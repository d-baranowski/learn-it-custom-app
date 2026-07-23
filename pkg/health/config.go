package health

type Config struct {
	AdvertiseAddr string `envconfig:"HEALTH_ADVERTISE_ADDR" default:""`
	Addr          string `envconfig:"HEALTH_ADDR" default:"0.0.0.0"`
	Port          int    `envconfig:"HEALTH_PORT" default:"8081"`
}
