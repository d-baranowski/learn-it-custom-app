/// <reference types="cypress" />

/**
 * RC_E2E_05 — Non-admin (Adam) views Room Calendar and edits own session
 *
 * Steps:
 * 1. Admin creates a session for Adam on today so it appears on the calendar.
 * 2. Login as Adam, navigate to Room Calendar.
 * 3. Verify room columns are visible.
 * 4. Click Adam's event (AH initials), verify therapist is Adam.
 * 5. Update price, save, verify change persists.
 * 6. Verify navigation works.
 */

import {
  loginAsAdmin,
  setupRoomCalendarForAdam,
  ADAM_FULL_NAME,
  formatISO,
} from './room-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import {
  createSessionViaForm,
  ADAM_THERAPIST_OPTION,
} from '../session-tests/session-test-utils';
import { getNextWeekday, formatDDMMYYYY } from '../../utils/date-utils';
import { loginAs } from '../../utils/test-users';

describe('Room Calendar NON-ADMIN VIEW', () => {
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
      price: '999',
    });

    // Now login as Adam and go to Room Calendar for that date
    setupRoomCalendarForAdam(dateISO);
  });

  it('RC_E2E_05: should allow Adam to view room calendar and edit his own sessions', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();
    const nav = new NavigationHelper();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Verify room columns are visible
    calendar.shouldHaveColumnHeader('B1');
    calendar.shouldHaveColumnHeader('T7');

    // Click an event with Adam's initials (AH)
    calendar.dblClickEvent('AH');
    calendar.waitForEditPanel();
    calendar.editPanelShouldHaveTherapist(ADAM_FULL_NAME);

    // Update price and save
    calendar.editPanelFillPrice('888');
    calendar.editPanelSave();
    calendar.waitForEditPanelClose();

    // Re-login as Adam — save can invalidate the session (401 on GetUserSession)
    loginAs('adam');
    nav.navigateToRoomCalendar(dateISO);
    calendar.waitForEvents();

    // Re-open to verify persistence
    calendar.dblClickEvent('AH');
    calendar.waitForEditPanel();
    calendar.editPanelGetPrice().should('eq', '888');

    // Close the edit panel explicitly before navigating
    calendar.editPanelCancel();

    // Navigate away
    nav.navigateToRoomCalendar(dateISO);

    // Verify navigation works
    calendar.clickNext();
    calendar.waitForCalendar();
    calendar.clickPrevious();
    calendar.waitForCalendar();
    calendar.clickToday();
    calendar.waitForCalendar();

    // Verify view modes work (via URL for headless reliability)
    calendar.switchViewViaUrl('week');
    calendar.waitForCalendar();
    calendar.switchViewViaUrl('day');
    calendar.waitForCalendar();
  });
});
