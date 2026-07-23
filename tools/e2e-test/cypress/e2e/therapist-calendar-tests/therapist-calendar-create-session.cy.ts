/// <reference types="cypress" />

/**
 * TC_CREATE_E2E_01 — A session created directly on the Therapist Calendar
 * appears immediately, WITHOUT a page reload.
 *
 * Why this exists: a regression shipped where the calendar's `afterSave`
 * (optimistic add + refetch) never ran, so newly-created sessions did not show
 * until the page was reloaded. Every existing calendar spec missed it because
 * they either navigate to the calendar fresh (`cy.visit` refetches from the DB
 * and masks a dead afterSave — see session-display-name-in-calendar.cy.ts) or
 * assert only static column headers.
 *
 * The guard here: create the session FROM the calendar slot, then assert the
 * event renders with NO `cy.visit`/`cy.reload`. The event can only appear via
 * the calendar's own afterSave path, so a dead afterSave fails this test.
 */

import { setupTherapistCalendarForAdmin } from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { SessionFormComponent } from '../components-objects/session-form.component';

describe('Therapist Calendar CREATE (no reload)', () => {
  beforeEach(() => {
    setupTherapistCalendarForAdmin();
  });

  it(
    'TC_CREATE_E2E_01: a session created from a calendar slot appears without reload',
    { tags: '@mutating' },
    () => {
      const calendar = new CalendarComponent();
      const form = new SessionFormComponent();
      const displayName = `SlotCreated_${Date.now()}`;

      calendar.waitForCalendar();
      calendar.waitForEvents();

      // Create from the calendar itself — the slot prefills the column's
      // therapist + date/time, so we only fill room/price/name. Relying on the
      // therapist prefill also guards that slot→resource wiring.
      calendar.openCreateFromFirstSlot();
      form.waitForOpen();
      form.shouldHaveTherapistPrefilled();
      form.selectRoom('B1');
      form.fillPrice('275');
      form.fillDisplayName(displayName);
      form.clickSave();

      // No cy.visit / cy.reload: the new event can only appear if the calendar's
      // afterSave fired (optimistic add, then refetch fills the label). A dead
      // afterSave leaves the calendar unchanged and this assertion times out.
      calendar.shouldHaveEvent(displayName);
    }
  );
});
