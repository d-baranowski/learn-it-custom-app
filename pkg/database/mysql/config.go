package mysql

type Config struct {
	Host      string `envconfig:"HOST" default:"localhost"`
	Port      int    `envconfig:"PORT" default:"3306"`
	Username  string `envconfig:"USERNAME" default:"root"`
	Password  string `envconfig:"PASSWORD" default:"password"`
	Database  string `envconfig:"DATABASE" default:"ump"`
	LogLevel  string `envconfig:"LOG_LEVEL" default:"info"`
	SSHTunnel *SSHTunnelConfig
}

type SSHTunnelConfig struct {
	Enabled        bool   `envconfig:"MYSQL_SSH_ENABLED"`
	Host           string `envconfig:"MYSQL_SSH_SERVER_HOST"`
	Port           int    `envconfig:"MYSQL_SSH_SERVER_PORT"`
	Username       string `envconfig:"MYSQL_SSH_USERNAME"`
	PrivateKey     string `envconfig:"MYSQL_SSH_PRIVATE_KEY"`      // base64 encode private key, or
	PrivateKeyFile string `envconfig:"MYSQL_SSH_PRIVATE_KEY_FILE"` // path to private key file
	KeyPassphrase  string `envconfig:"MYSQL_SSH_KEY_PASSPHRASE"`
}
