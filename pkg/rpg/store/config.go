package store

type Config struct {
	Permissions bool `envconfig:"RPG_PERMISSIONS_FLAG" default:"true"`
}
