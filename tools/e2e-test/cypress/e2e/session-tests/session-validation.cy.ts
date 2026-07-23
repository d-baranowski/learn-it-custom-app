/// <reference types="cypress" />

/**
 * SES_E2E_05 — Front-end validation: submit invalid session form
 *
 * Steps:
 * 1. Reset DB and login as admin.
 * 2. Navigate to Session page.
 * 3. Open the new session form.
 * 4. Attempt to submit without filling required fields.
 * 5. Assert validation errors appear on required fields.
 * 6. Fill required fields, verify errors clear and form submits.
 */

import {
  setupSessionTestForAdmin,
  getTomorrowFormatted,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';

describe('Session VALIDATION Tests (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_05: should show validation errors when submitting an incomplete session form', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const tomorrow = getTomorrowFormatted();

    form.clickNew();
    form.waitForFormLoad();

    // Fill only partial data — skip therapist (required) and price
    form.fillStartDateTime(tomorrow, '10:00');
    form.fillEndDateTime(tomorrow, '10:50');

    // Submit without therapist
    form.submit();

    // The form should remain open because validation failed
    form.waitForFormLoad();

    // Therapist is a required field — should show error
    form.shouldHaveFieldError('therapist-id');

    // Now fill the therapist and submit again
    form.selectTherapist(ADAM_THERAPIST_OPTION);
    form.selectRoom('B1');
    form.fillPrice('200');

    form.submit();
    form.waitForFormClose();
  });
});
