/// <reference types="cypress" />

/**
 * TC_E2E_02 — Admin navigates between views and dates on Therapist Calendar
 *
 * Steps:
 * 1. Login as admin, navigate to Therapist Calendar.
 * 2. Switch between Day, Week, Month views.
 * 3. Navigate with Next, Previous, Today buttons.
 * 4. Click Refresh.
 * 5. Switch to Compact view.
 *
 * Note: In headless Electron, toolbar button clicks do not reliably switch
 * calendar views. View switches use URL navigation as a workaround.
 */

import { setupTherapistCalendarForAdmin } from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Therapist Calendar ADMIN NAVIGATION', () => {
  beforeEach(() => {
    setupTherapistCalendarForAdmin();
  });

  it('TC_E2E_02: should navigate between views and dates', () => {
    const calendar = new CalendarComponent();
    const nav = new NavigationHelper();

    calendar.waitForCalendar();

    // --- View switches (via URL for headless reliability) ---

    // Switch to Week view
    calendar.switchViewViaUrl('week');
    calendar.waitForCalendar();

    // Switch back to Day view
    calendar.switchViewViaUrl('day');
    calendar.waitForCalendar();

    // Switch to Month view
    calendar.switchViewViaUrl('month');
    cy.url().should('include', 'view=month');

    // Switch back to Day from Month
    calendar.switchViewViaUrl('day');
    calendar.waitForCalendar();

    // --- Date navigation ---

    // Navigate forward
    calendar.getToolbarLabel().then((labelBefore) => {
      calendar.clickNext();
      calendar.getToolbarLabel().should((labelAfter) => {
        expect(labelAfter).to.not.eq(labelBefore);
      });
    });

    // Navigate back
    calendar.clickPrevious();
    calendar.waitForCalendar();

    // Click Today to return
    calendar.clickToday();
    calendar.waitForCalendar();

    // Refresh
    calendar.clickRefresh();
    calendar.waitForCalendar();

    // --- Compact view ---
    calendar.switchViewViaUrl('compact');
    cy.url().should('include', 'view=compact');

    // Return to Day view via fresh navigation
    nav.navigateToTherapistCalendar();
    calendar.waitForCalendar();
  });
});
