package service

import (
	"app/core/gen/core/v1/corev1connect"
	"app/gateway/config"
	"app/gateway/service"
)

func CoreServiceProvider(backends *config.Backends, gateway service.GatewayService) error {
	serviceNames := []string{
		corev1connect.AbsenceServiceName,
		corev1connect.CalendarServiceName,
		corev1connect.CountryServiceName,
		corev1connect.CustomerServiceName,
		corev1connect.IssuesAndSuggestionsServiceName,
		corev1connect.LanguageServiceName,
		corev1connect.OfficeServiceName,
		corev1connect.PermissionServiceName,
		corev1connect.RecurringCashflowServiceName,
		corev1connect.RoleServiceName,
		corev1connect.RoomServiceName,
		corev1connect.ServiceServiceName,
		corev1connect.SessionServiceName,
		corev1connect.SessionValidationServiceName,
		corev1connect.TeamServiceName,
		corev1connect.TherapistServiceLinkServiceName,
		corev1connect.TherapistServiceName,
		corev1connect.TherapyServiceName,
		corev1connect.TransactionServiceName,
		corev1connect.UserRoleServiceName,
		corev1connect.UserServiceName,
		corev1connect.TherapistCustomerLinkServiceName,
		corev1connect.WorkingHoursServiceName,
		corev1connect.FinancialDashboardServiceName,
	}

	for _, serviceName := range serviceNames {
		err := gateway.AddProxiedService(backends.Core, serviceName, true)
		if err != nil {
			return err
		}
	}

	return nil
}
