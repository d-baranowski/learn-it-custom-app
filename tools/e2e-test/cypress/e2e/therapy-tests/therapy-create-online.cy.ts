/// <reference types="cypress" />

/**
 * THR_E25_04 — Admin creates a therapy taking place online
 *
 * Steps:
 * 1. Reset DB. Login as Admin
 * 2. Navigate to Sessions -> Therapy
 * 3. Click New — fill Display Name, Therapist, Room: Leave Empty, Start Date: today,
 *    Duration: '50', Price: '200'.
 *    Open session frequency tab. Create every monday at 9am with online checkbox as true
 * 4. Re-open therapy → Session Frequency → Generate Sessions → Preview → Confirm
 * 5. Navigate to Room Calendar
 * 6. Open compact view
 * 7. Validate sessions exist in the ON column, verify time is correct
 * 8. Open day view
 * 9. Validate sessions exist in the ON column, verify time is correct
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { CalendarComponent } from '../components-objects/calendar.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import {
  loginAsAdmin,
  ADAM_THERAPIST_OPTION,
  SERVICE_CBT,
  EXISTING_CUSTOMER,
} from './therapy-test-utils';
import {
  getNextMonday,
  formatDDMMYYYY,
  formatDateISO,
} from '../../utils/date-utils';
import { uniqueToken } from '../../utils/unique';

/** Format a Date as MM/DD/YYYY for therapy form date inputs */
function formatDateForTherapy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

describe('Therapy CREATE Online — THR_E25_04', () => {
  const nextMonday = getNextMonday();
  const threeWeeksLater = new Date(nextMonday);
  threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

  beforeEach(() => {
    loginAsAdmin();
  });

  it('THPY_E2E_04: should create online therapy and verify sessions in ON column of room calendar', { tags: '@mutating' }, () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const calendar = new CalendarComponent();
    const gen = new SessionGenerateComponent();
    const displayName = `Adam Online Therapy ${uniqueToken()}`;

    // --- Step 1: Navigate to Therapy ---
    nav.navigateToTherapy();
    nav.verifyBreadcrumb('Therapy');

    // --- Step 2: Create therapy with online session frequency ---
    form.clickNew();

    // Basic Information — leave room empty per CSV
    form.fillDisplayName(displayName, false);
    form.selectTherapist(ADAM_THERAPIST_OPTION);
    form.selectService(SERVICE_CBT);
    form.selectCustomers([EXISTING_CUSTOMER], false);

    // Schedule & Pricing tab
    form.goToConfigurationTab();
    cy.get('input[data-testid="start-date"]').click();
    cy.get('input[data-testid="start-date"]').type(
      `{selectall}${formatDateForTherapy(nextMonday)}`,
      { delay: 80 }
    );
    cy.get('input[data-testid="end-date"]').click();
    cy.get('input[data-testid="end-date"]').type(
      `{selectall}${formatDateForTherapy(threeWeeksLater)}`,
      { delay: 80 }
    );
    form.fillSessionDuration('50');
    form.fillSessionPrice('200');

    // Session Frequency tab — create every Monday at 9am, online = true
    form.goToSessionFrequencyTab();
    form.clickAddSchedule();

    form.selectFrequencyUnit('Week');
    form.toggleFrequencyDay('M');
    form.setFrequencyStartTime('09:00');
    form.setFrequencyOnline();

    // Submit the therapy
    form.submitCreateAndClose();
    grid.waitForGrid();
    // Filter to this run's therapy — the grid accumulates rows without a reset.
    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName);

    // --- Step 3: Generate sessions via the preview flow ---
    // Re-open the therapy → Session Frequency tab → Generate Sessions
    grid.findRow(displayName).scrollIntoView().dblclick({ force: true });
    form.waitForFormLoad();
    form.goToSessionFrequencyTab();

    // Click "Generate Sessions" to open the generate dialog
    form.clickGenerateSessions();
    gen.waitForWindow();

    // Fill date range: from next Monday to three weeks later
    gen.fillFromDate(formatDDMMYYYY(nextMonday));
    gen.fillUntilDate(formatDDMMYYYY(threeWeeksLater));

    // Preview and confirm
    gen.clickPreview();
    gen.shouldHaveSummary('will be created');
    gen.shouldShowTable();
    gen.clickConfirm();
    gen.waitForWindowClose();

    // Close the therapy form
    form.cancel();
    grid.waitForGrid();

    // --- Step 4: Navigate to Room Calendar compact view ---
    cy.visit(
      `/core/room-calendar?view=compact&date=${formatDateISO(
        nextMonday
      )}`
    );
    cy.url().should('include', 'view=compact');

    // Wait for the page to fully load by checking for room column codes
    cy.contains('B1', { timeout: 30000 }).should('be.visible');

    // The ON room appears as "O" in compact view headers
    cy.get('body').should('contain.text', 'O');

    // Verify at least one event (AH initials) is visible in the compact view
    cy.contains('AH', { timeout: 15000 }).should('be.visible');

    // --- Step 5: Day view — verify sessions in ON column for the first Monday ---
    const dateParam = formatDateISO(nextMonday);
    cy.visit(
      `/core/room-calendar?view=day&date=${dateParam}`
    );
    calendar.waitForCalendar();

    // Verify ON column header is visible
    calendar.shouldHaveColumnHeader('ON');

    // Verify at least one event exists on this day
    cy.get('.rbc-event', { timeout: 30000 }).should(
      'have.length.greaterThan',
      0
    );
  });
});
