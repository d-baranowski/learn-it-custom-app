/// <reference types="cypress" />

/**
 * TC_E2E_05 — Non-admin (Adam) sees ONLY his own sessions on Therapist Calendar
 *
 * Steps:
 * 1. Admin seeds two sessions on the same day: one for Adam, one for Marta
 *    (a different therapist). Marta's is the control — Adam must not see it.
 * 2. Login as Adam, navigate to Therapist Calendar for that date.
 * 3. Assert exactly one therapist column is rendered and it is Adam's — a
 *    broken filter would surface Marta's column too.
 * 4. Assert the visible event belongs to Adam.
 *
 * Navigation and view-switching are covered by TC_E2E_02
 * (therapist-calendar-navigation.cy.ts), so they are intentionally not
 * re-exercised here.
 */

import {
  loginAsAdmin,
  setupTherapistCalendarForAdam,
  ADAM_FULL_NAME,
  ADAM_ABBREVIATION,
  formatISO,
} from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import {
  createSessionViaForm,
  ADAM_THERAPIST_OPTION,
  MARTA_THERAPIST_OPTION,
} from '../session-tests/session-test-utils';
import { getNextWeekday, formatDDMMYYYY } from '../../utils/date-utils';

describe('Therapist Calendar NON-ADMIN VIEW', () => {
  const targetDate = getNextWeekday();
  const dateStr = formatDDMMYYYY(targetDate);
  const dateISO = formatISO(targetDate);

  beforeEach(() => {
    // Admin creates a session for Adam on the next weekday
    loginAsAdmin();
    new NavigationHelper().navigateToSession();
    createSessionViaForm({
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: dateStr,
      startTime: '10:00',
      endDate: dateStr,
      endTime: '10:50',
      price: '500',
    });

    // Control: a different therapist's session on the same day. Adam must not
    // see this — without it, the "only Adam" assertion could pass simply
    // because no other therapist has data that day, not because filtering works.
    createSessionViaForm({
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: dateStr,
      startTime: '11:00',
      endDate: dateStr,
      endTime: '11:50',
      price: '500',
    });

    // Now login as Adam and go to Therapist Calendar for that date
    setupTherapistCalendarForAdam(dateISO);
  });

  it("TC_E2E_05: should show only Adam's sessions on therapist calendar", { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // The core assertion: as a non-admin therapist Adam is filtered to himself,
    // so the calendar renders exactly one therapist resource column — his. If
    // the filter leaked, Marta's seeded session would add a second column.
    // eslint-disable-next-line no-restricted-syntax -- non-admin sees exactly one therapist column: his own
    cy.get('.rbc-row.rbc-row-resource .rbc-header', { timeout: 15000 })
      .should('have.length', 1)
      .and('contain.text', ADAM_ABBREVIATION);

    // And the visible event is Adam's, not Marta's. Uses the retrying helper —
    // the legacy dblClickFirstEvent + waitForEditPanel pair occasionally lost
    // the dblclick under CI load and asserted on a localised title.
    calendar.dblClickFirstEventToOpenEditPanel();
    calendar.editPanelShouldHaveTherapist(ADAM_FULL_NAME);
    calendar.editPanelCancel();
  });
});
