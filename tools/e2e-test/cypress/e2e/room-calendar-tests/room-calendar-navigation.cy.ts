/// <reference types="cypress" />

/**
 * RC_E2E_02 — Admin navigates between views and dates on Room Calendar
 *
 * Steps:
 * 1. Login as admin, navigate to Room Calendar.
 * 2. Switch between Day, Week, Month views.
 * 3. Navigate with Next, Previous, Today buttons.
 * 4. Click Refresh.
 * 5. Switch to Compact view.
 */

import { setupRoomCalendarForAdmin } from './room-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Room Calendar ADMIN NAVIGATION', () => {
  beforeEach(() => {
    setupRoomCalendarForAdmin();
  });

  it('RC_E2E_02: should navigate between views and dates', () => {
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
    // switchViewViaUrl reloads the page; wait for the client-rendered events
    // before driving the toolbar, so next/prev land on a hydrated button rather
    // than the SSR markup (whose handlers aren't attached yet — the click would
    // be a no-op and the date never advance).
    calendar.waitForEvents();

    // --- Date navigation ---

    // Navigate forward
    calendar.getToolbarLabel().then((labelBeforeNext) => {
      calendar.clickNext();
      calendar.waitForCalendar();
      calendar.getToolbarLabel().should('not.eq', labelBeforeNext);
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
    nav.navigateToRoomCalendar();
    calendar.waitForCalendar();
  });
});
