package postgres

import (
	"fmt"
	"net/url"
)

type Config struct {
	SSL                  bool   `envconfig:"DB_SSL" default:"false"`
	Host                 string `envconfig:"DB_HOST" default:"localhost"`
	Port                 uint16 `envconfig:"DB_PORT" default:"5432"`
	DbName               string `envconfig:"DB_NAME" default:"rpg"`
	User                 string `envconfig:"DB_USER" default:"postgres"`
	Password             string `envconfig:"DB_PASS" default:"password"`
	AllowNativePasswords bool   `envconfig:"DB_ALLOW_NATIVE_PASSWORDS" default:"true"`
	Params               struct {
		ParseTime string
		Charset   string
		Loc       string
	}
	MaxIdleConnections int     `envconfig:"DB_MAX_IDLE_CONNECTIONS" default:"10"`
	MaxOpenConnections int     `envconfig:"DB_MAX_OPEN_CONNECTIONS" default:"25"` //25
	MaxConnLifetime    int     `envconfig:"DB_MAX_CONN_LIFETIME" default:"3600"`  //1800
	AutoMigrate        bool    `envconfig:"DB_AUTO_MIGRATE" default:"false"`
	LogLevel           string  `envconfig:"DB_LOG_LEVEL" default:"warn"`
	SearchPath         string  `envconfig:"DB_SEARCH_PATH" default:""`
	Trace              bool    `envconfig:"DB_TRACE" default:"false"`
	SaveQueryFilePath  *string `envconfig:"DB_SAVE_QUERY_FILE_PATH"`
}

func (c *Config) ConnectionString() string {
	sslMode := "disable"
	if c.SSL {
		sslMode = "require"
	}

	user := url.QueryEscape(c.User)
	password := url.QueryEscape(c.Password)

	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", user, password, c.Host, c.Port, c.DbName, sslMode)
}

func (c *Config) GetDSN(log bool) string {
	sslMode := "disable"
	if c.SSL {
		sslMode = "require"
	}
	if log {
		return fmt.Sprintf("host=%s user=%s password=#### dbname=%s port=%d sslmode=%s", c.Host, c.User, c.DbName, c.Port, sslMode)
	} else {
		return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s", c.Host, c.User, c.Password, c.DbName, c.Port, sslMode)
	}
}
