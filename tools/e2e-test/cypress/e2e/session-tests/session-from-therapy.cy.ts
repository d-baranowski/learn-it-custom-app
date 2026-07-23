/// <reference types="cypress" />

/**
 * SES_E2E_09 — Creating a therapy and generating sessions via the preview flow
 *
 * Requirements (from "Session Creation via Therapy"):
 * 1. Create a therapy with a single session frequency.
 * 2. Explicitly generate sessions via the preview → confirm flow.
 * 3. Verify sessions appear in: session list view, therapist calendar, room calendar.
 *
 * Strategy:
 * - Create a therapy with schedule Start = next Monday, End = +2 weeks,
 *   session frequency = every 1 week on Monday, time = 10:00.
 * - Submit the therapy, accept the post-save prompt, then generate sessions.
 * - Fill date range, preview, confirm.
 * - Navigate to Session list, filter by the start date range, verify sessions.
 * - Navigate to Therapist Calendar on day view for next Monday, verify event.
 * - Navigate to Room Calendar on day view for next Monday, verify event.
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { CalendarComponent } from '../components-objects/calendar.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import { fillDateFilter } from './session-test-utils';
import { generateRandomString } from '../therapy-tests/therapy-test-utils';

/** Get a future Monday's date object (the first Monday on or after tomorrow). */
function getNextMonday(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a Date as MM/DD/YYYY (therapy form start-date / end-date format) */
function formatDateForTherapy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Format a Date as DD/MM/YYYY (session grid filter + generate dialog format) */
function formatDateForSession(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format a Date as YYYY-MM-DD for URL parameters */
function formatDateISO(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

describe('Session CREATE from Therapy (Admin)', () => {
  const therapyName = `Therapy SesFreq ${generateRandomString(4)}`;
  const nextMonday = getNextMonday();
  const twoWeeksLater = new Date(nextMonday);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

  beforeEach(() => {
    cy.login();
  });

  it('SES_E2E_09: should create therapy with session frequency and generate sessions, then verify in list, therapist calendar, and room calendar', { tags: '@mutating' }, () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const calendar = new CalendarComponent();
    const gen = new SessionGenerateComponent();

    // --- Step 1: Create a therapy with session frequency ---
    nav.navigateToTherapy();

    form.clickNew();

    // Basic Information tab
    form.fillBasicInfo({
      displayName: therapyName,
      therapistName: 'Adam',
      serviceName: 'Cognitive Behavioral Therapy',
      customerNames: ['Johnson Mike'],
    });

    // Schedule & Pricing tab
    form.goToConfigurationTab();
    cy.get('input[data-testid="start-date"]').click();
    cy.get('input[data-testid="start-date"]').type(
      `{selectall}${formatDateForTherapy(nextMonday)}`,
      { delay: 80 }
    );
    cy.get('input[data-testid="end-date"]').click();
    cy.get('input[data-testid="end-date"]').type(
      `{selectall}${formatDateForTherapy(twoWeeksLater)}`,
      { delay: 80 }
    );

    // Session Frequency tab — add and configure a schedule entry
    form.goToSessionFrequencyTab();
    form.clickAddSchedule();
    form.selectFrequencyRoom('B1');

    form.selectFrequencyUnit('Week');
    form.toggleFrequencyDay('M');
    form.setFrequencyStartTime('10:00');

    // Submit the therapy — form stays open in edit mode
    form.submit();
    form.assertNotSaving();

    // Navigate to Session Frequency tab and generate sessions
    form.goToSessionFrequencyTab();
    cy.get('[data-testid="generate-sessions-btn"]', { timeout: 10000 }).should('be.visible');
    form.clickGenerateSessions();
    gen.waitForWindow();

    // Fill date range: from next Monday to two weeks later
    const fromDate = formatDateForSession(nextMonday);
    const untilDate = formatDateForSession(twoWeeksLater);
    gen.fillFromDate(fromDate);
    gen.fillUntilDate(untilDate);

    // Preview and confirm
    gen.clickPreview();
    gen.shouldHaveSummary('will be created');
    gen.shouldShowTable();
    gen.clickConfirm();
    gen.waitForWindowClose();

    // Close the therapy form
    form.cancel();
    grid.waitForGrid();

    // --- Step 3: Verify sessions in Session list ---
    nav.navigateToSession();

    // Use a narrow single-day filter (next Monday only) to avoid pagination issues
    const nextMondayFormatted = formatDateForSession(nextMonday);
    fillDateFilter('date-from', nextMondayFormatted);

    // Dismiss any calendar popup, wait for grid
    cy.get('body').click(0, 0);
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 15000,
    }).should('exist');

    // Verify at least one session with Adam and B1 appears
    grid.shouldContain('Adam');
    grid.shouldContain('B1');

    // --- Step 3b: Open the generated session and verify the client is set ---
    // Catches regressions where session generation forgets to copy the
    // therapy's customers onto each session.
    grid.findRow(therapyName).scrollIntoView().dblclick({ force: true });
    cy.get('[data-form-entity="session"]', { timeout: 15000 }).should('exist');
    cy.get('[data-form-entity="session"] input[data-testid="customer-ids"]')
      .closest('.MuiAutocomplete-root')
      .should('contain.text', 'Johnson Mike');
    cy.get('[data-form-entity="session"] [data-testid="form-cancel-btn"]').click();
    cy.get('[data-form-entity="session"]').should('not.exist');

    // --- Step 4: Verify session in Therapist Calendar ---
    const dateParam = formatDateISO(nextMonday);
    cy.visit(
      `/core/therapist-calendar?view=day&date=${dateParam}`
    );
    calendar.waitForCalendar();
    calendar.waitForEvents();
    calendar.shouldHaveColumnHeader('AH');

    // --- Step 5: Verify session in Room Calendar ---
    cy.visit(
      `/core/room-calendar?view=day&date=${dateParam}`
    );
    calendar.waitForCalendar();
    calendar.clickRefresh();
    calendar.waitForEvents();
    calendar.shouldHaveColumnHeader('B1');
  });
});
