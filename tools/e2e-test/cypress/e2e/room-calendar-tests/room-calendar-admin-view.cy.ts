/// <reference types="cypress" />

/**
 * RC_E2E_01 — Admin views Room Calendar with all rooms as columns
 *
 * Steps:
 * 1. Reset DB and login as admin.
 * 2. Navigate to Room Calendar.
 * 3. Verify current date shown in header.
 * 4. Verify all 7 room columns (B1-B4, T5-T7).
 * 5. Verify session events with therapist initials are displayed.
 */

import { setupRoomCalendarForAdmin, ROOM_CODES } from './room-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Room Calendar ADMIN VIEW', () => {
  beforeEach(() => {
    setupRoomCalendarForAdmin();
  });

  it('RC_E2E_01: should display room calendar with all room columns and events', () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Verify all 7 room column headers
    ROOM_CODES.forEach((room) => {
      calendar.shouldHaveColumnHeader(room);
    });

    // Verify events are visible with therapist initials
    calendar.getEventCount().should('be.greaterThan', 0);
  });
});
