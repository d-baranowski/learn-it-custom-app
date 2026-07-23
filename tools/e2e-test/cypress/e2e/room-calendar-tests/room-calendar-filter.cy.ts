/// <reference types="cypress" />

/**
 * RC_E2E_04 — Admin filters Room Calendar via inline toolbar filters
 */

import { setupRoomCalendarForAdmin, ROOM_CODES } from './room-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Room Calendar ADMIN FILTER', () => {
  beforeEach(() => {
    setupRoomCalendarForAdmin();
  });

  it('RC_E2E_04: should filter room calendar by a specific room', () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Verify all seeded room columns exist before filtering. Assert a superset
    // (>= seeded count, each seeded code present) rather than an exact count —
    // rooms created by other specs accumulate without a DB reset and may add
    // calendar columns.
    calendar.assertRoomColumnCountAtLeast(ROOM_CODES.length);
    ROOM_CODES.forEach((code) => calendar.shouldHaveRoomColumn(code));

    // Apply inline filter for B1
    calendar.toggleInlineRoomFilter('B1');

    // Verify B1 column is visible (ON/online room may also persist)
    calendar.assertRoomColumnCountAtMost(2);
    calendar.shouldHaveRoomColumn('B1');

    // Clear inline filter by toggling the same option off
    calendar.toggleInlineRoomFilter('B1');

    // Verify all seeded room columns are restored (superset — see above).
    calendar.assertRoomColumnCountAtLeast(ROOM_CODES.length);
    ROOM_CODES.forEach((code) => calendar.shouldHaveRoomColumn(code));
  });
});
