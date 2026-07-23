/// <reference types="cypress" />

/**
 * RC_E2E_03 — Admin clicks a session event on Room Calendar to open Edit Session
 *             panel and changes the room
 *
 * Steps:
 * 1. Login as admin, navigate to Room Calendar.
 * 2. Click a session event in a known room column.
 * 3. Verify Edit Session panel opens with pre-populated fields.
 * 4. Change Room to a different room, click Save.
 * 5. Verify the session appears under the new room column.
 */

import { setupRoomCalendarForAdmin } from './room-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Room Calendar ADMIN EDIT', () => {
  beforeEach(() => {
    setupRoomCalendarForAdmin();
  });

  it('RC_E2E_03: should open edit panel from calendar event and change room', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Click the first visible event
    calendar.dblClickFirstEvent();
    calendar.waitForEditPanel();

    // Verify therapist is pre-populated
    calendar.editPanelShouldHaveTherapistPopulated();

    // Change room to T6
    calendar.editPanelSelectRoom('T6');
    calendar.editPanelSave();
    calendar.waitForEditPanelClose();

    // Wait for calendar to refresh
    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Verify T6 column has an event (the session we moved)
    calendar.shouldHaveColumnHeader('T6');
  });
});
