package api

import (
	"app/core/api/service"
	"app/core/api/service/auth"
	"app/core/api/service/calendar"
	"app/core/api/service/dev"
	"app/core/api/service/financial_dashboard"
	"app/core/api/service/me"
	"app/core/api/service/session"
	"app/core/api/service/session_validation"
	"app/core/api/service/system_settings"

	"go.uber.org/fx"
)

var Module = fx.Module("handlers",
	fx.Provide(service.PaymentServiceClientProvider),
	fx.Invoke(auth.ServiceProvider),
	fx.Invoke(calendar.ServiceProvider),
	fx.Invoke(dev.ServiceProvider),
	fx.Invoke(financial_dashboard.ServiceProvider),
	fx.Invoke(me.ServiceProvider),
	fx.Invoke(service.AbsenceServiceProvider),
	fx.Invoke(service.WorkingHoursServiceProvider),
	fx.Invoke(service.CountryServiceProvider),
	fx.Invoke(service.CustomerServiceProvider),
	fx.Invoke(service.IssuesAndSuggestionsServiceProvider),
	fx.Invoke(service.LanguageServiceProvider),
	fx.Invoke(service.OfficeServiceProvider),
	fx.Invoke(service.PermissionServiceProvider),
	fx.Invoke(service.RecurringCashflowServiceProvider),
	fx.Invoke(service.RoleServiceProvider),
	fx.Invoke(service.RoomServiceProvider),
	fx.Invoke(service.ServiceServiceProvider),
	fx.Invoke(service.SessionServiceProvider),
	fx.Invoke(service.TeamServiceProvider),
	fx.Invoke(service.TherapistCustomerLinkServiceProvider),
	fx.Invoke(service.TherapistServiceLinkServiceProvider),
	fx.Invoke(service.TherapistServiceProvider),
	fx.Invoke(service.TherapyServiceProvider),
	fx.Invoke(service.TransactionServiceProvider),
	fx.Invoke(service.UserRoleServiceProvider),
	fx.Invoke(service.UserServiceProvider),
	fx.Invoke(session.ServiceProvider),
	fx.Invoke(session_validation.ServiceProvider),
	fx.Invoke(system_settings.ServiceProvider),
)
