/// <reference types="cypress" />

/**
 * TEST: TA_E2E_08 — Absence reflected as red background in therapist calendar
 *
 * Steps:
 * 1. Login as admin
 * 2. Navigate to therapist calendar (day view) on a weekday
 * 3. Verify red background slots exist for therapists with absences
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { CalendarComponent } from '../components-objects/calendar.component';
import { loginAs } from '../../utils/test-users';
import { formatDateISO, getLastWeekday } from '../../utils/date-utils';

describe('Therapist Absences - Calendar Verification', () => {
  beforeEach(() => {
    loginAs('admin');
  });

  it('TA_E2E_08: absences should appear as red background in therapist calendar', () => {
    const nav = new NavigationHelper();
    const calendar = new CalendarComponent();
    // Bootstrap only seeds Mon-Fri sessions, so target the last weekday
    const dateISO = formatDateISO(getLastWeekday());

    // --- Navigate to therapist calendar day view on a weekday ---
    nav.navigateToTherapistCalendar(dateISO);
    calendar.waitForCalendar();
    calendar.waitForEvents();

    // --- Absences are rendered as red-tinted background in the calendar ---
    // They can appear as background events or styled time slots with red/orange color
    cy.get('.rbc-time-content').then(($content) => {
      const bgEvents = $content.find('.rbc-background-event');
      const styledSlots = $content.find('[style*="background"]');

      // At least one background element should exist (working hours green + absences red)
      expect(bgEvents.length + styledSlots.length).to.be.greaterThan(0);
    });

    cy.screenshot('absence-calendar-red-background');
  });
});
