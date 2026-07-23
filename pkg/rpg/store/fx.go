package store

import (
	"go.uber.org/fx"
)

func UserStoreProvider(lc fx.Lifecycle, storeProps StoreProps) (UserStore, error) {
	return NewUserStore(lc, storeProps)
}

func PermissionStoreProvider(lc fx.Lifecycle, storeProps StoreProps) (PermissionStore, error) {
	return NewPermissionStore(lc, storeProps)
}

var Module = fx.Module("rpg",
	fx.Provide(PermissionStoreProvider),
	fx.Provide(UserStoreProvider),
)
