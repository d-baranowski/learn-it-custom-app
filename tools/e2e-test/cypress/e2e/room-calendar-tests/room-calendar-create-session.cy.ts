/// <reference types="cypress" />

/**
 * RC_CREATE_E2E_01 — A session created directly on the Room Calendar appears
 * immediately, WITHOUT a page reload, and the slot's room is prepopulated.
 *
 * Mirror of the therapist-calendar create spec. Guards two things:
 *   1. The calendar's afterSave (optimistic add + refetch) — the event can only
 *      appear without a reload if afterSave fires.
 *   2. Slot→resource prefill — opening a slot in a room column prepopulates that
 *      room, so we only pick a therapist here.
 */

import { setupRoomCalendarForAdmin } from './room-calendar-test-utils';
import { ADAM_THERAPIST_OPTION } from '../session-tests/session-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';
import { SessionFormComponent } from '../components-objects/session-form.component';

describe('Room Calendar CREATE (no reload)', () => {
  beforeEach(() => {
    setupRoomCalendarForAdmin();
  });

  it(
    'RC_CREATE_E2E_01: a session created from a room slot appears without reload, room prefilled',
    { tags: '@mutating' },
    () => {
      const calendar = new CalendarComponent();
      const form = new SessionFormComponent();
      const displayName = `RoomSlotCreated_${Date.now()}`;

      calendar.waitForCalendar();
      calendar.waitForEvents();

      // Create from the calendar itself — the slot prefills the column's room +
      // date/time, so we only pick a therapist. Asserting the room prefill also
      // guards the slot→resource wiring.
      calendar.openCreateFromFirstSlot();
      form.waitForOpen();
      form.shouldHaveRoomPrefilled();
      form.selectTherapist(ADAM_THERAPIST_OPTION);
      form.fillPrice('275');
      form.fillDisplayName(displayName);
      form.clickSave();

      // No cy.visit / cy.reload: the new event can only appear if the calendar's
      // afterSave fired (optimistic add, then refetch fills the label).
      calendar.shouldHaveEvent(displayName);
    }
  );
});
