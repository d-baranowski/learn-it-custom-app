/// <reference types="cypress" />

/**
 * Session cancellation flow E2E
 *
 * Covers:
 * 1) Cancel wizard validation (reason + actor required)
 * 2) Successful cancel from row context menu and read-only cancellation fields in form
 * 3) Undo cancellation from row context menu and cleared cancellation section in form
 * 4) Cancelling user is recorded in the "Cancelled By User" grid column
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPY_OPTION,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { SessionCancellationWizardComponent } from '../components-objects/session-cancellation-wizard.component';
import { uniquePrice } from '../../utils/unique';

describe(
  'Session CANCELLATION Tests (Admin)',
  () => {
    beforeEach(() => {
      setupSessionTestForAdmin();
    });

    // SES_CANCEL_E2E_01 (reason required, actor defaults to Therapist)
    // migrated to jest — session_cancellation_dialog.test.tsx asserts both.

    it('SES_CANCEL_E2E_02: should cancel from context menu and show read-only cancellation info in form', { tags: '@mutating' }, () => {
      const form = new SessionFormComponent();
      const grid = new GridComponent();
      const wizard = new SessionCancellationWizardComponent();
      const tomorrow = getTomorrowFormatted();
      const cancellationReason = 'Customer requested reschedule';
      const price = String(uniquePrice());

      createSessionViaForm({
        therapyText: ADAM_THERAPY_OPTION,
        therapistText: ADAM_THERAPIST_OPTION,
        roomText: 'B2',
        startDate: tomorrow,
        startTime: '10:00',
        endDate: tomorrow,
        endTime: '10:50',
        price,
      });

      adjustDateFiltersForTomorrow();
      wizard.cancelSessionForPrice(price, cancellationReason, 'Customer');

      grid.openRow(price, true);
      form.waitForFormLoad();

      wizard.expectReadOnlyInfo('Customer', cancellationReason);

      form.cancel();
    });

    it('SES_CANCEL_E2E_03: should undo cancellation from context menu and clear cancellation section in form', { tags: '@mutating' }, () => {
      const form = new SessionFormComponent();
      const grid = new GridComponent();
      const wizard = new SessionCancellationWizardComponent();
      const tomorrow = getTomorrowFormatted();
      const price = String(uniquePrice());

      createSessionViaForm({
        therapyText: ADAM_THERAPY_OPTION,
        therapistText: ADAM_THERAPIST_OPTION,
        roomText: 'T5',
        startDate: tomorrow,
        startTime: '11:00',
        endDate: tomorrow,
        endTime: '11:50',
        price,
      });

      adjustDateFiltersForTomorrow();
      wizard.cancelSessionForPrice(price, 'Therapist unavailable', 'Therapist');

      wizard.undoCancellationForPrice(price);

      grid.openRow(price, true);
      form.waitForFormLoad();

      wizard.expectNoCancellationInfo();

      form.cancel();
    });

    it('SES_CANCEL_E2E_04: should record the cancelling user in the "Cancelled By User" column', { tags: '@mutating' }, () => {
      const grid = new GridComponent();
      const wizard = new SessionCancellationWizardComponent();
      const tomorrow = getTomorrowFormatted();
      const price = String(uniquePrice());

      createSessionViaForm({
        therapyText: ADAM_THERAPY_OPTION,
        therapistText: ADAM_THERAPIST_OPTION,
        roomText: 'B3',
        startDate: tomorrow,
        startTime: '12:00',
        endDate: tomorrow,
        endTime: '12:50',
        price,
      });

      adjustDateFiltersForTomorrow();
      wizard.cancelSessionForPrice(
        price,
        'Customer requested reschedule',
        'Therapist'
      );

      // Reveal the hidden "Cancelled By User" column and assert it shows the
      // logged-in admin's display name ("Admin") for the cancelled row. Guards
      // the server-stamped cancelled_by_user_id surviving the UPDATE — before
      // the fix this column stayed empty.
      grid.showColumn('Cancelled By User');
      grid.findRow(price, true).should('contain.text', 'Admin');
    });
  }
);
