package store

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/fx"
	"go.uber.org/zap"
	apiv1 "pkg/api/gen/api/v1"
	"pkg/maps"
	"pkg/tracing"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/reflect/protoregistry"
	"google.golang.org/protobuf/types/descriptorpb"
)

const (
	PermissionsHashKey = "__hash__"
)

type UserPermissions = map[string][]string

type PermissionStore interface {
	CheckUserPermissions(ctx context.Context, userID string, key string, ability string) bool
	GetUserPermissions(ctx context.Context, userID string) (UserPermissions, bool)
	GetUserGroupPermissions(ctx context.Context, userID, key string) ([]string, bool)
	Set(ctx context.Context, userID string, permissions map[string][]string, ttlSeconds ...int64) error
	SetEnforce(enforce bool)
	GetEnforce() bool
}

type permissionStorePG struct {
	enforce bool
	db      *pgxpool.Pool
	store   *maps.SafeMultiMap[string, string, []string]
	log     *zap.Logger
	tracer  *tracing.Tracer

	ready  bool
	live   bool
	cancel context.CancelFunc
}

func NewPermissionStore(lc fx.Lifecycle, props StoreProps) (PermissionStore, error) {
	s := &permissionStorePG{
		enforce: props.Config.Permissions,
		db:      props.DB,
		store:   maps.NewSafeMultiMap[string, string, []string](),

		log:    zap.L().Named("rpg-permission-store"),
		tracer: tracing.NewTracer("rpg-permission-store"),
		live:   true,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return s.Start(ctx)
		},
		OnStop: func(ctx context.Context) error {
			return s.Stop(ctx)
		},
	})

	props.HealthServer.AddService(s)

	return s, nil
}

func (s *permissionStorePG) Start(ctx context.Context) error {
	s.log.Info("starting permission store")

	// Load initial data (excluding expired permissions)
	rows, err := s.db.Query(ctx, `
    SELECT user_id, permissions
    FROM core.permission_store
    WHERE expires_at IS NULL OR expires_at > NOW()
  `)
	if err != nil {
		s.log.Error("failed to fetch permissions", zap.Error(err))
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		var permissionsJSON []byte

		if err := rows.Scan(&userID, &permissionsJSON); err != nil {
			s.log.Error("failed to scan permission row", zap.Error(err))
			continue
		}

		var permissions map[string][]string
		if err := jsoniter.Unmarshal(permissionsJSON, &permissions); err != nil {
			s.log.Error("failed to unmarshal permissions", zap.Error(err))
			continue
		}

		for key, abilities := range permissions {
			s.store.Set(userID, key, abilities)
		}
	}

	// Start listening for changes
	listenCtx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	go s.listenForChanges(listenCtx)

	s.ready = true

	return nil
}

func (s *permissionStorePG) listenForChanges(ctx context.Context) {
	backoff := newRetryBackoff(250*time.Millisecond, 10*time.Second)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		if err := s.listenOnce(ctx); err != nil {
			if ctx.Err() != nil {
				return
			}

			// The LISTEN connection can be closed (db restart/network hiccup).
			// Back off and reconnect.
			s.log.Error("permission_store_changes listener error; will reconnect", zap.Error(err))
			backoff.Sleep(ctx)
			continue
		}

		// If listenOnce returned nil, reset backoff and keep listening.
		backoff.Reset()
	}
}

func (s *permissionStorePG) listenOnce(ctx context.Context) error {
	conn, err := s.db.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("failed to acquire connection for listener: %w", err)
	}
	defer conn.Release()

	// A LISTEN session is idle by design — it parks in WaitForNotification until
	// someone NOTIFYs — so the cluster-wide idle_session_timeout reaps it on a
	// timer and we lose every notification until the reconnect lands. Opt this
	// one session out, and reset before the connection goes back to the pool so
	// the exemption never rides along on a reused connection.
	if _, err := conn.Exec(ctx, "SET idle_session_timeout = 0"); err != nil {
		return fmt.Errorf("failed to disable idle_session_timeout on listener: %w", err)
	}
	defer func() {
		// Best effort: if the server already terminated the session this fails,
		// and pgx discards the connection rather than pooling it.
		if _, err := conn.Exec(context.WithoutCancel(ctx), "RESET idle_session_timeout"); err != nil {
			s.log.Debug("failed to reset idle_session_timeout on listener connection", zap.Error(err))
		}
	}()

	if _, err := conn.Exec(ctx, "LISTEN permission_store_changes"); err != nil {
		return fmt.Errorf("failed to LISTEN permission_store_changes: %w", err)
	}

	// Reset backoff after a successful LISTEN.
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			notification, err := conn.Conn().WaitForNotification(ctx)
			if err != nil {
				// If ctx canceled, just exit quietly.
				if ctx.Err() != nil {
					return nil
				}
				// Signal outer loop to reconnect.
				return err
			}

			s.handleNotification(notification.Payload)
		}
	}
}

func (s *permissionStorePG) handleNotification(payload string) {
	var event struct {
		Operation   string                 `json:"operation"`
		UserID      string                 `json:"user_id"`
		Permissions map[string]interface{} `json:"permissions"`
	}

	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		s.log.Error("failed to unmarshal notification", zap.Error(err))
		return
	}

	switch event.Operation {
	case "INSERT", "UPDATE":
		permissions := make(map[string][]string)
		for key, val := range event.Permissions {
			if arr, ok := val.([]interface{}); ok {
				strArr := make([]string, 0, len(arr))
				for _, v := range arr {
					if s, ok := v.(string); ok {
						strArr = append(strArr, s)
					}
				}
				permissions[key] = strArr
			}
		}

		for key, abilities := range permissions {
			s.store.Set(event.UserID, key, abilities)
		}

	case "DELETE":
		// Delete all permissions for this user
		permissions := make(map[string][]string)
		for key, val := range event.Permissions {
			if arr, ok := val.([]interface{}); ok {
				strArr := make([]string, 0, len(arr))
				for _, v := range arr {
					if s, ok := v.(string); ok {
						strArr = append(strArr, s)
					}
				}
				permissions[key] = strArr
			}
		}

		for key := range permissions {
			s.store.Delete(event.UserID, key)
		}
	}
}

func (s *permissionStorePG) Stop(_ context.Context) error {
	s.ready = false
	s.live = false

	if s.cancel != nil {
		s.cancel()
	}

	return nil
}

func (s *permissionStorePG) CheckUserPermissions(ctx context.Context, userID string, key string, ability string) bool {
	if !s.enforce {
		return true
	}

	allAbilities, ok := s.GetUserGroupPermissions(ctx, userID, "All")
	if ok {
		for _, a := range allAbilities {
			if a == ability {
				return true
			}
			if a == "All" {
				return true
			}
		}
	}

	abilities, ok := s.GetUserGroupPermissions(ctx, userID, key)
	if !ok {
		return false
	}

	for _, a := range abilities {
		if a == ability {
			return true
		}
	}

	return false
}

func (s *permissionStorePG) GetUserPermissions(ctx context.Context, userID string) (map[string][]string, bool) {
	if !s.enforce {
		return GetAllSystemPermissions(), true
	}

	// Query user_permission_view which returns rows: (user_id, key, scope, abilities)
	// We need to aggregate abilities across all scopes for each key
	permissions := make(map[string][]string)
	rows, err := s.db.Query(ctx, `
		SELECT key, abilities
		FROM core.user_permission_view
		WHERE user_id = $1
		`, userID)
	if err != nil {
		return nil, false
	}
	defer rows.Close()

	// Use a map to track seen keys for deduplication
	seen := make(map[string]map[string]struct{})

	for rows.Next() {
		var key string
		var abilities []string

		if err := rows.Scan(&key, &abilities); err != nil {
			return nil, false
		}

		// Initialize seen map for this key if not exists
		if seen[key] == nil {
			seen[key] = make(map[string]struct{})
		}

		// Add unique abilities for this key
		for _, ability := range abilities {
			if _, exists := seen[key][ability]; !exists {
				seen[key][ability] = struct{}{}
				permissions[key] = append(permissions[key], ability)
			}
		}
	}

	return permissions, true
}

func (s *permissionStorePG) GetUserGroupPermissions(ctx context.Context, userID, key string) ([]string, bool) {
	if !s.enforce {
		return GetAllSystemPermissions()[key], true
	}

	// Query user_permission_view for the specific key
	// Aggregate abilities across all scopes for this key
	abilities := make([]string, 0)
	seen := make(map[string]struct{})

	rows, err := s.db.Query(ctx, `
		SELECT abilities
		FROM core.user_permission_view
		WHERE user_id = $1 AND key = $2
		`, userID, key)
	if err != nil {
		return nil, false
	}
	defer rows.Close()

	for rows.Next() {
		var rowAbilities []string
		if err := rows.Scan(&rowAbilities); err != nil {
			return nil, false
		}

		// Add unique abilities
		for _, ability := range rowAbilities {
			if _, exists := seen[ability]; !exists {
				seen[ability] = struct{}{}
				abilities = append(abilities, ability)
			}
		}
	}

	if len(abilities) == 0 {
		return nil, false
	}

	return abilities, true
}

func (s *permissionStorePG) Set(ctx context.Context, userID string, permissions map[string][]string, ttlSeconds ...int64) error {
	delete(permissions, PermissionsHashKey)
	newHash := hashPermissions(permissions)
	permissions[PermissionsHashKey] = []string{strconv.FormatUint(newHash, 16)}

	data, err := jsoniter.Marshal(permissions)
	if err != nil {
		return err
	}

	oldPermissions, found := s.store.GetCopy(userID)

	if found {
		delete(oldPermissions, PermissionsHashKey)
		oldHash := hashPermissions(oldPermissions)

		if oldHash == newHash {
			return nil
		}
	}

	hashStr := strconv.FormatUint(newHash, 16)

	// Handle TTL if provided
	var expiresAt *time.Time
	if len(ttlSeconds) > 0 && ttlSeconds[0] > 0 {
		expiry := time.Now().Add(time.Duration(ttlSeconds[0]) * time.Second)
		expiresAt = &expiry
	}

	if expiresAt != nil {
		_, err = s.db.Exec(ctx, `
      INSERT INTO core.permission_store (user_id, permissions, hash, expires_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        permissions = $2,
        hash = $3,
        expires_at = $4,
        updated_at = NOW()
    `, userID, data, hashStr, expiresAt)
	} else {
		_, err = s.db.Exec(ctx, `
      INSERT INTO core.permission_store (user_id, permissions, hash, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        permissions = $2,
        hash = $3,
        expires_at = NULL,
        updated_at = NOW()
    `, userID, data, hashStr)
	}

	if err != nil {
		return err
	}

	return nil
}

func (s *permissionStorePG) SetEnforce(enforce bool) {
	s.enforce = enforce
}

func GetAllSystemPermissions() map[string][]string {
	result := make(map[string][]string)
	protoregistry.GlobalFiles.RangeFiles(func(desc protoreflect.FileDescriptor) bool {
		for i := 0; i < desc.Services().Len(); i++ {
			svcDesc := desc.Services().Get(i)
			svcOpts, ok := svcDesc.Options().(*descriptorpb.ServiceOptions)
			if !ok {
				panic(fmt.Errorf("could not assert %T to ServiceOptions", svcDesc.Options()))
			}

			var permKey = string(svcDesc.Name())
			if proto.HasExtension(svcOpts, apiv1.E_PermissionKey) {
				ext, permGroupOk := proto.GetExtension(svcOpts, apiv1.E_PermissionKey).(string)
				if permGroupOk {
					permKey = ext
				}
			}

			result[permKey] = make([]string, 0)

			// get service descriptor from desc by the method name
			for j := 0; j < svcDesc.Methods().Len(); j++ {
				methodDescriptor := svcDesc.Methods().Get(j)
				mOpts := methodDescriptor.Options().(*descriptorpb.MethodOptions)
				var permAbility = string(methodDescriptor.Name())
				if proto.HasExtension(mOpts, apiv1.E_PermissionAbility) {
					ext, abilityOk := proto.GetExtension(mOpts, apiv1.E_PermissionAbility).(string)
					if abilityOk {
						permAbility = ext
					}
				}

				result[permKey] = append(result[permKey], permAbility)
			}
		}

		return true
	})

	return result
}

func (s *permissionStorePG) GetEnforce() bool {
	return s.enforce
}

func hashPermissions(m map[string][]string) uint64 {
	h := fnv.New64a()

	// Get the keys and sort them to ensure deterministic order
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Hash the map
	for _, k := range keys {
		_, _ = h.Write([]byte(k)) // Hash the key
		// Sort the values for the key to ensure deterministic order
		sort.Strings(m[k])
		for _, v := range m[k] {
			_, _ = h.Write([]byte(v)) // Hash each value
		}
	}

	return h.Sum64()
}

func (s *permissionStorePG) LiveCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	return s.db.Ping(ctx)
}

func (s *permissionStorePG) ReadyCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	return s.db.Ping(ctx)
}

func ExtractUserId(key string) (string, error) {
	// base key = "/rpg/permissions/"
	parts := strings.Split(key, "/")
	// First part is empty because key starts with /
	if len(parts) != 4 {
		return "", fmt.Errorf("invalid key: %s", key)
	}
	return parts[3], nil
}
