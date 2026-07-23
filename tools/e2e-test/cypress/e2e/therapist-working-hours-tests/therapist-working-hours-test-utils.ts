/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';
import { ADAM } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { formatDateISO, getLastWeekday } from '../../utils/date-utils';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';

export function navigateToWorkingHoursPage(baseUrl: string = '/core/working-hours'): void {
  cylog('navigate to working hours page');
  cy.visit(baseUrl);
  new WorkingHoursFormComponent().waitForEditorLoad();
}

export function setupAsAdmin(options?: { baseUrl?: string }): void {
  setupFor('admin', () => navigateToWorkingHoursPage(options?.baseUrl));
}

export const TEST_THERAPIST = ADAM.fullName;
export const SECOND_THERAPIST = 'Dr. Anna Kowalska';

export const VALID_WORKING_HOURS = {
  therapistName: TEST_THERAPIST,
  dayOfWeek: 1,
  fromTime: '08:00',
  tillTime: '16:00',
};

export const UPDATED_WORKING_HOURS = {
  fromTime: '09:00',
  tillTime: '17:00',
};

/** Today if a weekday, else last Friday — bootstrap only seeds Mon-Fri sessions. */
export function getTodayOrLastWeekdayISO(): string {
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  return formatDateISO(isWeekend ? getLastWeekday() : today);
}

// Calendar helpers below are candidates for CalendarComponent, which is
// owned by another test group; promote them there in a follow-up.

/** Working hours render as background events or styled slots in the calendar. */
export function assertWorkingHoursBackgroundRendered(): void {
  cy.get('.rbc-time-content', { timeout: 45000 }).should('exist');
  cy.get('.rbc-day-slot').should('have.length.greaterThan', 0);
  cy.get('.rbc-time-content').then(($content) => {
    const bgEvents = $content.find('.rbc-background-event');
    const styledSlots = $content.find('[style*="background"]');
    expect(bgEvents.length + styledSlots.length).to.be.greaterThan(0);
  });
}

/** Sessions outside working hours get a WarningAmberIcon inside their event. */
export function assertOutsideWorkingHoursWarningVisible(): void {
  cy.get('.rbc-event .MuiSvgIcon-root').should('have.length.greaterThan', 0);
}
