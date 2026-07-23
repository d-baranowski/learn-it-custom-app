/// <reference types="cypress" />

/**
 * SES_E2E — One-off session (no therapy) renders its display_name in the calendar.
 *
 * Regression: sessions created without a therapy used to have no label in the
 * Therapist Calendar because the backend pulled `title` from
 * `session.Therapy.DisplayName`. The Session form now exposes a Display Name
 * input, the session row carries its own `display_name`, and the calendar
 * uses it (with a therapy fallback).
 *
 * UI-level flow:
 *   1. Login as admin, open Session grid.
 *   2. Open New form, fill Therapist + Room + Date/Time + Price + Display Name
 *      (no therapy).
 *   3. Save → form closes, row lands in grid.
 *   4. Navigate to Therapist Calendar on that date.
 *   5. Assert a calendar event renders with our Display Name as its label.
 */

import {
  setupSessionTestForAdmin,
  getTomorrowFormatted,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { CalendarComponent } from '../components-objects/calendar.component';

describe(
  'Session Display Name in Calendar',
  () => {
    beforeEach(() => {
      setupSessionTestForAdmin();
    });

    it('SES_DN_E2E_01: one-off session display_name appears as the calendar event label', { tags: '@mutating' }, () => {
      const form = new SessionFormComponent();
      const grid = new GridComponent();
      const calendar = new CalendarComponent();

      const tomorrow = getTomorrowFormatted();
      const displayName = `OneOffLabel_${Date.now()}`;

      form.clickNew();
      form.waitForFormLoad();

      form.selectTherapist(ADAM_THERAPIST_OPTION);
      form.selectRoom('B1');
      form.fillStartDateTime(tomorrow, '10:00');
      form.fillEndDateTime(tomorrow, '10:50');
      form.fillPrice('270');
      form.fillDisplayName(displayName);

      form.submit();
      form.waitForFormClose();
      grid.waitForGrid();

      const [dd, mm, yyyy] = tomorrow.split('/');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      cy.visit(`/en/core/therapist-calendar?view=day&date=${isoDate}`);

      calendar.waitForCalendar();

      cy.get('.rbc-event', { timeout: 30000 })
        .contains(displayName)
        .should('be.visible');
    });
  },
);
