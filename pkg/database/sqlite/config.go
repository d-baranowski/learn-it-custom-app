package sqlite

import "strings"

type Config struct {
	DriverName string `envconfig:"SQLITE_DRIVER_NAME" default:""`
	FileName   string `envconfig:"SQLITE_FILENAME" default:"sqlite.db"`
	Mode       string `envconfig:"SQLITE_MODEL" default:""`
	Cache      string `envconfig:"SQLITE_CACHE" default:""`
}

func NewSqliteConfig() *Config {
	return &Config{
		FileName: "sqlite.db",
	}
}

func (p *Config) Dsn() string {
	//db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	//db, err := gorm.Open(sqlite.Open("file:rater?mode=memory&cache=shared"), &gorm.Config{
	//db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{

	builder := strings.Builder{}
	if p.FileName != "" {
		builder.WriteString("file:")
		builder.WriteString(p.FileName)
		builder.WriteString("?")
	} else {
		builder.WriteString(":")
	}
	if p.Mode != "" {
		builder.WriteString("mode=")
		builder.WriteString(p.Mode)
		builder.WriteString("&")
	}
	if p.Cache != "" {
		builder.WriteString("cache=")
		builder.WriteString(p.Cache)
	} else {
		builder.WriteString("cache=shared")
	}
	return builder.String()
}
