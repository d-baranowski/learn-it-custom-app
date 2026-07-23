/// <reference types="cypress" />

/**
 * TC_E2E_03 — Admin clicks a session event to open Edit Session panel and edits it
 *
 * Steps:
 * 1. Login as admin, navigate to Therapist Calendar.
 * 2. Click a session event.
 * 3. Verify Edit Session panel opens with pre-populated fields.
 * 4. Update Price, click Save.
 * 5. Re-open the event and verify the update persisted.
 */

import { setupTherapistCalendarForAdmin } from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Therapist Calendar ADMIN EDIT', () => {
  beforeEach(() => {
    setupTherapistCalendarForAdmin();
  });

  it('TC_E2E_03: should open edit panel from calendar event and update price', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Click the first visible event to open the edit panel
    calendar.dblClickFirstEvent();
    calendar.waitForEditPanel();

    // Verify therapist field is pre-populated
    calendar.editPanelShouldHaveTherapistPopulated();

    // Update price to 175
    calendar.editPanelFillPrice('175');
    calendar.editPanelSave();
    calendar.waitForEditPanelClose();

    // Wait for calendar to refresh
    calendar.waitForCalendar();
    calendar.waitForEvents();

    // Re-open the same event to verify update persisted
    calendar.dblClickFirstEvent();
    calendar.waitForEditPanel();
    calendar.editPanelGetPrice().should('eq', '175');
    calendar.editPanelCancel();
  });
});
