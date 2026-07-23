package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"pkg/repository"
	"pkg/unix"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uptrace/bun"
)

func boolPtr(v bool) *bool       { return &v }
func strPtr(v string) *string    { return &v }

func TestValidateRoomForOfflineSession_RejectsNilRoom(t *testing.T) {
	session := &model.Session{IsOnline: boolPtr(false), RoomId: nil}
	err := validateRoomForOfflineSession(context.Background(), bun.Tx{}, session, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "room is required")
}

func TestValidateRoomForOfflineSession_RejectsEmptyRoom(t *testing.T) {
	session := &model.Session{IsOnline: boolPtr(false), RoomId: strPtr("")}
	err := validateRoomForOfflineSession(context.Background(), bun.Tx{}, session, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "room is required")
}

func TestValidateRoomForOfflineSession_AcceptsRoomPresent(t *testing.T) {
	session := &model.Session{IsOnline: boolPtr(false), RoomId: strPtr("rm-1")}
	err := validateRoomForOfflineSession(context.Background(), bun.Tx{}, session, nil)
	assert.NoError(t, err)
}

func TestValidateRoomForOfflineSession_SkipsOnlineSession(t *testing.T) {
	session := &model.Session{IsOnline: boolPtr(true), RoomId: nil}
	err := validateRoomForOfflineSession(context.Background(), bun.Tx{}, session, nil)
	assert.NoError(t, err)
}

func TestValidateRoomForOfflineSession_SkipsWhenIsOnlineNil(t *testing.T) {
	session := &model.Session{IsOnline: nil, RoomId: nil}
	err := validateRoomForOfflineSession(context.Background(), bun.Tx{}, session, nil)
	assert.NoError(t, err)
}

func TestClearTherapySessionFrequencyRef(t *testing.T) {
	ref := "freq-ref-123"
	session := &model.Session{TherapySessionFrequencyRef: &ref}
	err := clearTherapySessionFrequencyRef(context.Background(), bun.Tx{}, session, nil)
	require.NoError(t, err)
	assert.Nil(t, session.TherapySessionFrequencyRef)
}

func TestClearTherapySessionFrequencyRef_AlreadyNil(t *testing.T) {
	session := &model.Session{TherapySessionFrequencyRef: nil}
	err := clearTherapySessionFrequencyRef(context.Background(), bun.Tx{}, session, nil)
	require.NoError(t, err)
	assert.Nil(t, session.TherapySessionFrequencyRef)
}

// cancelledByUserId is stamped server-side by the cancellation pre-hooks, but
// UpdateMethod excludes any model column whose name is absent from the request
// proto (isExcludedFromUpdate returns true when the descriptor field is nil).
// Without cancelledByUserId on SaveSessionRequest the stamped value is silently
// dropped on UPDATE, leaving the grid's "Cancelled By User" column empty.
func TestSaveSessionRequest_CarriesCancelledByUserId(t *testing.T) {
	fd := (&corev1.SaveSessionRequest{}).ProtoReflect().
		Descriptor().Fields().ByName("cancelledByUserId")
	require.NotNil(t, fd,
		"SaveSessionRequest must carry cancelledByUserId so the server-stamped value persists on update")
}

func TestStampCancelledByOnCreate_StampsUserWhenCancelled(t *testing.T) {
	uid := "2userAdmin0000000000000000"
	session := &model.Session{CancelledAt: unix.NowPtr()}
	extra := &repository.ExtraInfoReq[corev1.SaveSessionRequest]{UserId: &uid}

	err := stampCancelledByOnCreate(context.Background(), bun.Tx{}, session, extra)
	require.NoError(t, err)
	require.NotNil(t, session.CancelledByUserId)
	assert.Equal(t, uid, *session.CancelledByUserId)
}

func TestStampCancelledByOnCreate_ClearsWhenNotCancelled(t *testing.T) {
	uid := "2userAdmin0000000000000000"
	session := &model.Session{CancelledAt: nil, CancelledByUserId: &uid}
	extra := &repository.ExtraInfoReq[corev1.SaveSessionRequest]{UserId: &uid}

	err := stampCancelledByOnCreate(context.Background(), bun.Tx{}, session, extra)
	require.NoError(t, err)
	assert.Nil(t, session.CancelledByUserId)
}
