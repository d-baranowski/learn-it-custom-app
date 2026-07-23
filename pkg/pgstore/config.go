package pgstore

type Config struct {
	ElectionTtl int `envconfig:"PGSTORE_ELECTION_TTL" default:"15"`
}
