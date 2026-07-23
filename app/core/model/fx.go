package model

import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/schema"
	"go.uber.org/fx"
)

var Module = fx.Module("modelModule",
	fx.Invoke(CustomerLabel),
	fx.Invoke(LanguageLabel),
	fx.Invoke(OfficeLabel),
	fx.Invoke(RecurringCashflowLabel),
	fx.Invoke(RoleLabel),
	fx.Invoke(RoomLabel),
	fx.Invoke(ServiceLabel),
	fx.Invoke(SessionLabel),
	fx.Invoke(CancelledByUserLabel),
	fx.Invoke(TeamLabel),
	fx.Invoke(TherapistAbbreviationLabel),
	fx.Invoke(TherapistLabel),
	fx.Invoke(TherapyLabel),
	fx.Invoke(UserAbbreviationLabel),
	fx.Invoke(UserLabel),
	fx.Invoke(UserRolesLabel),
	fx.Invoke(UserTeamsLabel),
	fx.Invoke(registerModelsWithBun),
)

func registerModelsWithBun(db *bun.DB, tables *schema.Tables) {
	db.RegisterModel((*Absence)(nil))
	tables.Register((*Absence)(nil))
	db.RegisterModel((*WorkingHours)(nil))
	tables.Register((*WorkingHours)(nil))
	db.RegisterModel((*Country)(nil))
	tables.Register((*Country)(nil))
	db.RegisterModel((*IssuesAndSuggestions)(nil))
	tables.Register((*IssuesAndSuggestions)(nil))

	db.RegisterModel((*Language)(nil))
	tables.Register((*Language)(nil))
	db.RegisterModel((*Office)(nil))
	tables.Register((*Office)(nil))
	db.RegisterModel((*Permission)(nil))
	tables.Register((*Permission)(nil))
	db.RegisterModel((*Role)(nil))
	tables.Register((*Role)(nil))
	db.RegisterModel((*Room)(nil))
	tables.Register((*Room)(nil))
	db.RegisterModel((*Service)(nil))
	tables.Register((*Service)(nil))
	// Order matters

	db.RegisterModel((*SessionCustomer)(nil))
	db.RegisterModel((*Session)(nil))
	db.RegisterModel((*Customer)(nil))

	tables.Register(
		(*SessionCustomer)(nil),
		(*Session)(nil),
		(*Customer)(nil),
	)

	db.RegisterModel((*Team)(nil))
	tables.Register((*Team)(nil))

	db.RegisterModel((*User)(nil))
	tables.Register((*User)(nil))
	db.RegisterModel((*RecurringCashflow)(nil))
	tables.Register((*RecurringCashflow)(nil))
	db.RegisterModel((*Transaction)(nil))
	tables.Register((*Transaction)(nil))
	db.RegisterModel((*TherapistCustomer)(nil))
	tables.Register((*TherapistCustomer)(nil))
	db.RegisterModel((*TherapistService)(nil))
	tables.Register((*TherapistService)(nil))
	db.RegisterModel((*Therapist)(nil))
	tables.Register((*Therapist)(nil))
	db.RegisterModel((*TherapyCustomer)(nil))
	tables.Register((*TherapyCustomer)(nil))
	db.RegisterModel((*Therapy)(nil))
	tables.Register((*Therapy)(nil))
	db.RegisterModel((*UserLock)(nil))
	tables.Register((*UserLock)(nil))
	db.RegisterModel((*UserPermission)(nil))
	tables.Register((*UserPermission)(nil))
	db.RegisterModel((*UserRole)(nil))
	tables.Register((*UserRole)(nil))
	db.RegisterModel((*UserSession)(nil))
	tables.Register((*UserSession)(nil))
	db.RegisterModel((*UserSetting)(nil))
	tables.Register((*UserSetting)(nil))
	db.RegisterModel((*UserTeam)(nil))
	tables.Register((*UserTeam)(nil))
	db.RegisterModel((*SystemSettings)(nil))
	tables.Register((*SystemSettings)(nil))
}
