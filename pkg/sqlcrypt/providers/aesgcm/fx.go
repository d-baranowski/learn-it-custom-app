package aesgcm

import (
	"encoding/hex"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"pkg/sqlcrypt"
)

func ProvideCrypter() error {
	// todo: create config options for providers
	key, err := hex.DecodeString("fb7f69d3f824045c2685ad859593470df11e45256480802517cb20fc19b0d15e")
	if err != nil {
		zap.L().Error("failed to hex decode data encryption key", zap.Error(err))
		return err
	}

	aesCrypter, err := New(key, nil)
	if err != nil {
		return err
	}

	sqlcrypt.Init(aesCrypter)

	return nil
}

// Module provided to fx
var Module = fx.Module("crypt-sql",
	fx.Invoke(ProvideCrypter),
)
