package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"pkg/repository"
	"pkg/rpg/store"
	"pkg/tracing"
	"pkg/unix"

	log "github.com/sirupsen/logrus"
	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type PermissionService interface {
	OnAppStartup(ctx context.Context) error

	AfterPermissionCreated(ctx context.Context, tx bun.Tx, req *model.Permission) error
	AfterPermissionUpdated(ctx context.Context, tx bun.Tx, req *model.Permission) error
	AfterPermissionsDeleted(ctx context.Context, tx bun.Tx, req []*model.Permission) error
	AfterRolesDeleted(ctx context.Context, tx bun.Tx, req []*model.Role) error
	AfterUsersDeleted(ctx context.Context, tx bun.Tx, req []*model.User) error
	AfterUserRoleCreated(ctx context.Context, tx bun.Tx, req *model.UserRole) error
	AfterUserRoleUpdated(ctx context.Context, tx bun.Tx, req *model.UserRole) error
	AfterUserRolesDeleted(ctx context.Context, tx bun.Tx, req []*model.UserRole) error
	SyncTouchedUserPermissions(ctx context.Context, userIds []string, tx bun.Tx) error
}

type PermissionServiceProps struct {
	fx.In

	PermissionStore store.PermissionStore
	ModelParser     repository.ModelParser
	ViewEngine      *repository.ViewEngine
	DB              *bun.DB
	Log             *zap.Logger
}

func PermissionServiceProvider(lc fx.Lifecycle, props PermissionServiceProps) (PermissionService, error) {
	tracer := tracing.NewTracer("service.permissionService")
	result := &permissionService{
		permissionStore: props.PermissionStore,
		log:             props.Log,
	}

	result.repository = repository.NewRepository[model.Permission, corev1.Permission, corev1.SavePermissionRequest](props.DB, tracer, props.ModelParser, props.ViewEngine)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			err := result.OnAppStartup(ctx)
			if err != nil {
				log.Error("failed to start permission service", zap.Error(err))
				return err
			}

			return result.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return result.Stop(ctx)
		},
	})

	return result, nil
}

type permissionService struct {
	permissionStore store.PermissionStore
	repository      *repository.Repository[model.Permission, corev1.Permission, corev1.SavePermissionRequest]
	log             *zap.Logger
	ready           bool
	live            bool
}

func (p *permissionService) AfterUserRoleCreated(ctx context.Context, tx bun.Tx, req *model.UserRole) error {
	return p.SyncTouchedUserPermissions(ctx, []string{req.UserId}, tx)
}

func (p *permissionService) AfterUserRoleUpdated(ctx context.Context, tx bun.Tx, req *model.UserRole) error {
	return p.SyncTouchedUserPermissions(ctx, []string{req.UserId}, tx)
}

func (p *permissionService) AfterUserRolesDeleted(ctx context.Context, tx bun.Tx, req []*model.UserRole) error {
	touchedUsers := make([]string, len(req))
	for i, role := range req {
		touchedUsers[i] = role.UserId
	}
	return p.SyncTouchedUserPermissions(ctx, touchedUsers, tx)
}

func (p *permissionService) OnAppStartup(ctx context.Context) error {
	log.Info("initial permission sync to PostgreSQL")

	// Declare a slice to hold user Ids
	var dbUserIds []string

	err := p.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		// Fetch only the user Ids from the database
		err := tx.NewSelect().
			Model((*model.User)(nil)).
			Column("id"). // Specify to select only the "id" column
			Scan(ctx, &dbUserIds)
		if err != nil {
			return err
		}

		err = p.SyncTouchedUserPermissions(ctx, dbUserIds, tx)
		if err != nil {
			return err
		}

		return nil
	}, repository.RunExtraProps{SkipRLS: true})

	return err
}

func (p *permissionService) AfterRolesDeleted(ctx context.Context, tx bun.Tx, req []*model.Role) error {
	roleIds := make([]string, len(req))
	for i, role := range req {
		roleIds[i] = role.Id
	}
	touchedUsers, err := p.getRoleUserIds(ctx, roleIds, tx)
	if err != nil {
		return err
	}
	return p.SyncTouchedUserPermissions(ctx, touchedUsers, tx)
}

func (p *permissionService) AfterUsersDeleted(ctx context.Context, tx bun.Tx, req []*model.User) error {
	userIds := make([]string, len(req))
	for i, user := range req {
		userIds[i] = user.Id
	}
	return p.SyncTouchedUserPermissions(ctx, userIds, tx)
}

func (p *permissionService) AfterPermissionCreated(ctx context.Context, tx bun.Tx, req *model.Permission) error {
	if req.UserId != nil {
		return p.SyncTouchedUserPermissions(ctx, []string{*req.UserId}, tx)
	}

	if req.RoleId != nil {
		touchedUsers, err := p.getRoleUserIds(ctx, []string{*req.RoleId}, tx)
		if err != nil {
			return err
		}
		return p.SyncTouchedUserPermissions(ctx, touchedUsers, tx)
	}

	return nil
}

func (p *permissionService) AfterPermissionUpdated(ctx context.Context, tx bun.Tx, req *model.Permission) error {
	if req.UserId != nil {
		return p.SyncTouchedUserPermissions(ctx, []string{*req.UserId}, tx)
	}

	if req.RoleId != nil {
		touchedUsers, err := p.getRoleUserIds(ctx, []string{*req.RoleId}, tx)
		if err != nil {
			return err
		}
		return p.SyncTouchedUserPermissions(ctx, touchedUsers, tx)
	}

	return nil
}

func (p *permissionService) AfterPermissionsDeleted(ctx context.Context, tx bun.Tx, req []*model.Permission) error {
	userIds := make([]string, 0)
	roleIds := make([]string, 0)

	for _, permission := range req {
		if permission.UserId != nil {
			userIds = append(userIds, *permission.UserId)
		}
		if permission.RoleId != nil {
			roleIds = append(roleIds, *permission.RoleId)
		}
	}

	if len(roleIds) > 0 {
		touchedUsers, err := p.getRoleUserIds(ctx, roleIds, tx)
		if err != nil {
			return err
		}

		userIds = append(userIds, touchedUsers...)
	}

	return p.SyncTouchedUserPermissions(ctx, userIds, tx)
}

func (p *permissionService) getPermissions(ctx context.Context, userIds []string, roleIds []string, tx bun.Tx) ([]*model.Permission, error) {
	var permissions []*model.Permission

	err := tx.NewRaw(`SELECT * FROM core.permission p
         WHERE p.user_id IN (?) OR p.role_id IN (?)`, bun.In(userIds), bun.In(roleIds)).Scan(ctx, &permissions)

	if err != nil {
		return nil, err
	}

	return permissions, nil
}

func (p *permissionService) getUserRoles(ctx context.Context, userIds []string, db bun.Tx) ([]*model.UserRole, error) {
	var result []*model.UserRole

	err := db.
		NewRaw(`SELECT * FROM core.user_role ur WHERE ur.user_id IN (?) AND (ur.expires_at IS NULL OR ur.expires_at > core.unix_timestamp());`, bun.In(userIds)).
		Scan(ctx, &result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (p *permissionService) getRoleUserIds(ctx context.Context, roleIds []string, db bun.Tx) ([]string, error) {
	var result []string

	err := db.
		NewRaw(`SELECT ur.user_id FROM core.user_role ur WHERE ur.role_id IN (?) AND (ur.expires_at IS NULL OR ur.expires_at > core.unix_timestamp())`, bun.In(roleIds)).
		Scan(ctx, &result)

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (p *permissionService) SyncTouchedUserPermissions(ctx context.Context, userIds []string, tx bun.Tx) error {
	if userIds == nil || len(userIds) == 0 {
		return nil
	}

	userRoles, err := p.getUserRoles(ctx, userIds, tx)
	if err != nil {
		return err
	}

	roleIds := make([]string, len(userRoles))
	userIdToRoleIds := make(map[string][]string)
	expirations := make(map[string]*model.UserRole)

	for i, role := range userRoles {
		roleIds[i] = role.RoleId
		if role.ExpiresAt != nil {
			expirations[role.RoleId] = role
		}
		if userIdToRoleIds[role.UserId] == nil {
			userIdToRoleIds[role.UserId] = make([]string, 0)
		}
		userIdToRoleIds[role.UserId] = append(userIdToRoleIds[role.UserId], role.RoleId)
	}

	permissions, err := p.getPermissions(ctx, userIds, roleIds, tx)
	if err != nil {
		return err
	}

	keyedPermissions := make(map[string][]*model.Permission)
	for _, p := range permissions {
		if p.UserId != nil {
			if keyedPermissions[*p.UserId] == nil {
				keyedPermissions[*p.UserId] = make([]*model.Permission, 0)
			}
			keyedPermissions[*p.UserId] = append(keyedPermissions[*p.UserId], p)
		}
		if p.RoleId != nil {
			if keyedPermissions[*p.RoleId] == nil {
				keyedPermissions[*p.RoleId] = make([]*model.Permission, 0)
			}
			keyedPermissions[*p.RoleId] = append(keyedPermissions[*p.RoleId], p)
		}
	}

	userToRoleIds := make(map[string][]string)
	for _, ur := range userRoles {
		if userToRoleIds[ur.UserId] == nil {
			userToRoleIds[ur.UserId] = make([]string, 0)
		}
		userToRoleIds[ur.UserId] = append(userToRoleIds[ur.UserId], ur.RoleId)
	}

	for _, uId := range userIds {
		allPerms := make([]*model.Permission, 0)
		for _, roleId := range userToRoleIds[uId] {
			allPerms = append(allPerms, keyedPermissions[roleId]...)
		}

		allPerms = append(allPerms, keyedPermissions[uId]...)

		mapped := mapPermissions(allPerms)

		ml := findMinimumLease(userIdToRoleIds[uId], expirations)
		if ml != nil {
			secondsLeft := ml.Sub(unix.Now()).Int64() / 1000
			err = p.permissionStore.Set(ctx, uId, mapped, secondsLeft)
		} else {
			err = p.permissionStore.Set(ctx, uId, mapped)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func mapPermissions(permissions []*model.Permission) map[string][]string {
	// Temporary map to store permission updates
	result := make(map[string]map[string]bool)

	// Apply non-revoked permissions first
	for _, permission := range permissions {
		if !permission.Revoke {
			if _, exists := result[permission.Key]; !exists {
				result[permission.Key] = make(map[string]bool)
			}
			// Add abilities to the map
			for _, ability := range permission.Abilities {
				result[permission.Key][ability] = true
			}
		}
	}

	// Apply revoked permissions last
	for _, permission := range permissions {
		if permission.Revoke {
			if _, exists := result[permission.Key]; exists {
				// Remove abilities that are revoked
				for _, ability := range permission.Abilities {
					delete(result[permission.Key], ability)
				}
			}
		}
	}

	// Convert map to the final result
	finalResult := make(map[string][]string)
	for key, abilitiesMap := range result {
		var abilities []string
		for ability := range abilitiesMap {
			abilities = append(abilities, ability)
		}
		// Only add non-empty abilities
		if len(abilities) > 0 {
			finalResult[key] = abilities
		}
	}

	return finalResult
}

func findMinimumLease(roleIds []string, expirationsByRoleId map[string]*model.UserRole) *unix.Timestamp {
	var minExpiration *unix.Timestamp

	for _, roleId := range roleIds {
		if userRole, exists := expirationsByRoleId[roleId]; exists {
			if userRole.ExpiresAt != nil {
				if minExpiration == nil || userRole.ExpiresAt.Before(*minExpiration) {
					minExpiration = userRole.ExpiresAt
				}
			}
		}
	}

	return minExpiration
}

func (s *permissionService) Start(ctx context.Context) error {
	s.log.Info("starting permission service")

	// With PostgreSQL-based permission store, the LISTEN/NOTIFY mechanism
	// handles real-time updates automatically. We don't need to watch for
	// permission changes here as the store itself manages that.
	//
	// Permission expiration is handled by the expires_at column in the database.
	// A periodic cleanup job could be added if needed, but PostgreSQL queries
	// will automatically exclude expired permissions.

	s.ready = true
	return nil
}

func (s *permissionService) Stop(_ context.Context) error {
	s.ready = false
	s.live = false

	return nil
}
