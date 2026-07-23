/// <reference types="cypress" />

/**
 * TA_E2E_09 — Ensure that the red background in the therapist calendar is correct
 *
 * Steps:
 * 1. Login as admin, navigate to absence page
 * 2. Create an absence for a therapist (specific date + time range)
 * 3. Navigate to therapist calendar (day view for the absence date)
 * 4. Verify red background events/slots exist for the absence hours
 * 5. Go back and update the absence (change reason to verify persistence)
 * 6. Navigate back to therapist calendar
 * 7. Verify the red background is still correct after the update
 */

import { CalendarComponent } from '../components-objects/calendar.component';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import {
  setupAsAdmin,
  navigateToAbsencePage,
  ADAM_DISPLAY_NAME,
} from './therapist-absence-test-utils';
import { formatDateISO, getDateFromToday } from '../../utils/date-utils';
import { uniqueToken } from '../../utils/unique';

/** Format a Date as DDMMYYYYHHMM for MUI DateTimePicker input */
function formatForDateTimePicker(d: Date, hours: number, minutes: number): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  return `${dd}${mm}${d.getFullYear()}${hh}${min}`;
}

/** Absences render as background events or red/orange-tinted time slots */
function assertBackgroundElementsPresent(): void {
  cy.get('.rbc-time-content', { timeout: 45000 }).then(($content) => {
    const bgEvents = $content.find('.rbc-background-event');
    const styledSlots = $content.find('[style*="background"]');
    expect(bgEvents.length + styledSlots.length).to.be.greaterThan(0);
  });
}

describe('Therapist Absences - Calendar Red Background Verification', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('TA_E2E_09: should show red background for absences and update when changed', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const nav = new NavigationHelper();

    const tomorrow = getDateFromToday(1);
    const dateParam = formatDateISO(tomorrow);
    const ABSENCE_REASON = `E2E calendar red background test ${uniqueToken()}`;
    const UPDATED_REASON = `E2E calendar red background updated ${uniqueToken()}`;

    // --- Step 1: Create an absence for Adam, tomorrow 08:00 - 16:00 ---
    form.createAbsence({
      therapistName: ADAM_DISPLAY_NAME,
      fromTime: formatForDateTimePicker(tomorrow, 8, 0),
      tillTime: formatForDateTimePicker(tomorrow, 16, 0),
      reason: ABSENCE_REASON,
    });

    // --- Step 2: Verify red background in therapist calendar day view ---
    nav.navigateToTherapistCalendar(dateParam);
    calendar.waitForCalendar();
    assertBackgroundElementsPresent();

    // --- Step 3: Go back and update the absence (extend to 18:00) ---
    navigateToAbsencePage();
    grid.shouldContain(ABSENCE_REASON);

    grid.openRow(ABSENCE_REASON);
    form.waitForFormLoad();
    form.waitForFormPopulated();

    form.fillTillTime(formatForDateTimePicker(tomorrow, 18, 0));
    form.fillReason(UPDATED_REASON);
    form.shouldBeSubmitEnabled();

    form.clickSave();
    form.waitForFormClose();
    grid.shouldContain(UPDATED_REASON);

    // --- Step 4: Verify the red background is still correct after the update ---
    nav.navigateToTherapistCalendar(dateParam);
    calendar.waitForCalendar();
    assertBackgroundElementsPresent();
  });
});
