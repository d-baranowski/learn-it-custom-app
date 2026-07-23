package mysql

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	sqlD "github.com/go-sql-driver/mysql"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/mysqldialect"
	"github.com/uptrace/bun/extra/bundebug"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"golang.org/x/crypto/ssh"
	sqltrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/database/sql"
	"os"
	"pkg/base"
	"pkg/logging"
	"time"
)

type Connection struct {
	DB    *bun.DB
	SqlDB *sql.DB
}

func NewMysqlConnection(lc fx.Lifecycle, config *Config,
	serviceName *base.ServiceName, log *zap.Logger) (*Connection, error) {

	c := &Connection{}
	var dsn string

	if config.SSHTunnel.Enabled {
		sshConfig := ssh.ClientConfig{
			User:            config.SSHTunnel.Username,
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		}

		signer, err := getSigner(config)
		if err != nil {
			return nil, err
		}

		sshConfig.Auth = []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		}

		sshTunnelAddr := fmt.Sprintf("%s:%d", config.SSHTunnel.Host, config.SSHTunnel.Port)

		cli, err := ssh.Dial("tcp", sshTunnelAddr, &sshConfig)
		if err != nil {
			return nil, err
		}

		log.Info("ssh tunnel established", zap.String("addr", sshTunnelAddr))

		lc.Append(fx.Hook{
			OnStop: func(ctx context.Context) error {
				log.Info("closing ssh tunnel")
				return cli.Close()
			},
		})

		sqlD.RegisterDialContext("mysql+ssh", (&Dialer{client: cli}).Dial)

		dsn = fmt.Sprintf("%s:%s@mysql+ssh(%s)/%s?charset=utf8mb4",
			config.Username,
			config.Password,
			fmt.Sprintf("%s:%d", config.Host, config.Port),
			config.Database,
		)
	} else {
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4",
			config.Username,
			config.Password,
			config.Host,
			config.Port,
			config.Database,
		)
	}

	sqltrace.Register("pgx", &stdlib.Driver{}, sqltrace.WithServiceName(serviceName.String()))

	sqlDB, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Error("failed to connect to mysql", zap.Error(err))
		return nil, err
	}
	c.SqlDB = sqlDB

	bunDB := bun.NewDB(sqlDB, mysqldialect.New())
	bunDB.AddQueryHook(logging.NewQueryHook(logging.QueryHookOptions{
		Logger:       log,
		SlowDuration: 200 * time.Millisecond, // Omit to log all operations as debug
	}))
	if config.LogLevel == "debug" {
		bunDB.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
	}

	c.DB = bunDB

	log.Info("connected to mysql")

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			log.Info("closing mysql connection")
			return c.SqlDB.Close()
		},
	})

	return c, nil
}

func getSigner(config *Config) (ssh.Signer, error) {
	var key []byte
	var err error

	// Check if PrivateKey is supplied
	if config.SSHTunnel.PrivateKey != "" {
		// Decode the base64 encoded private key
		key, err = base64.StdEncoding.DecodeString(config.SSHTunnel.PrivateKey)
		if err != nil {
			return nil, errors.New("failed to decode base64 private key: " + err.Error())
		}
	} else {
		// Read the private key from the file
		key, err = os.ReadFile(config.SSHTunnel.PrivateKeyFile)
		if err != nil {
			return nil, err
		}
	}

	// Parse the private key
	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, err
	}

	return signer, nil
}
