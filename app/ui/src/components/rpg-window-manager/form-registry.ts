/**
 * Form Registry for RpgWindowManager
 *
 * This file should be imported early in the application lifecycle (e.g., in _app.tsx)
 * to register all forms that can be opened via the window manager.
 */

import type { FormRegistryContextValue } from '~/providers/form-registry';
import { TherapyForm } from '~/sections/core/therapy/therapy_form';
import { SessionForm } from '~/sections/core/session/session_form';
import { AbsenceForm } from '~/sections/core/absence/absence_form';
import { IssuesAndSuggestionsForm } from '~/sections/core/issues-and-suggestions/issues_and_suggestions_form';
import { CustomerForm } from '~/sections/core/customer/customer_form';
import { OfficeForm } from '~/sections/core/office/office_form';
import { PaymentLinkForm } from '~/sections/core/payment-link/payment_link_form';
import { RecurringCashflowForm } from '~/sections/core/recurring-cashflow/recurring_cashflow_form';
import { RoomForm } from '~/sections/core/room/room_form';
import { ServiceForm } from '~/sections/core/service/service_form';
import { TherapistForm } from '~/sections/core/therapist/therapist_form';
import { TherapistCustomerForm } from '~/sections/core/therapist-customer/therapist_customer_form';
import { TherapistServiceForm } from '~/sections/core/therapist-service/therapist_service_form';
import { TransactionForm } from '~/sections/core/transaction/transaction_form';
import { WorkingHoursForm } from '~/sections/core/working-hours/working_hours_form';
import { SessionGeneratePreview } from '~/sections/core/therapy/session-generate/session_generate_preview';
import { UpdateSessionPrices } from '~/sections/core/therapy/session-price-update/update_session_prices';
import { PermissionForm } from '~/sections/system/users/permission-form';
import { RoleForm } from '~/sections/system/users/role-form';
import { TeamForm } from '~/sections/system/users/team-form';
import { UserForm } from '~/sections/system/users/user-form';
import { UserRoleForm } from '~/sections/system/users/user-role-form';
import { NotificationTemplateForm } from '~/sections/core/notification-template/notification_template_form';

/**
 * Initialize the form registry by registering all available forms.
 * You should call this once (usually in _app.tsx) using the context-provided registerForm.
 */
const initializeFormRegistry = (
  registerForm: FormRegistryContextValue['registerForm']
) => {
  // Core
  registerForm('AbsenceForm', AbsenceForm);
  registerForm('CustomerForm', CustomerForm);
  registerForm('IssuesAndSuggestionsForm', IssuesAndSuggestionsForm);
  registerForm('OfficeForm', OfficeForm);
  registerForm('PaymentLinkForm', PaymentLinkForm);
  registerForm('RecurringCashflowForm', RecurringCashflowForm);
  registerForm('RoomForm', RoomForm);
  registerForm('ServiceForm', ServiceForm);
  registerForm('SessionForm', SessionForm);
  registerForm('TherapistForm', TherapistForm);
  registerForm('TherapistCustomerForm', TherapistCustomerForm);
  registerForm('TherapistServiceForm', TherapistServiceForm);
  registerForm('TherapyForm', TherapyForm);
  registerForm('TransactionForm', TransactionForm);
  registerForm('WorkingHoursForm', WorkingHoursForm);
  registerForm('SessionGeneratePreview', SessionGeneratePreview);
  registerForm('UpdateSessionPrices', UpdateSessionPrices);
  registerForm('NotificationTemplateForm', NotificationTemplateForm);

  // System Users
  registerForm('PermissionForm', PermissionForm);
  registerForm('RoleForm', RoleForm);
  registerForm('TeamForm', TeamForm);
  registerForm('UserForm', UserForm);
  registerForm('UserRoleForm', UserRoleForm);

  console.log('Form registry initialized');
};
export default initializeFormRegistry;
