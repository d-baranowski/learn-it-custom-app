/// <reference types="cypress" />

/**
 * TC_E2E — Compact view renders online sessions (regression for UTR-000113)
 *
 * Background: sessions without a room (is_online = TRUE) were silently dropped
 * from the Compact view because the backend therapist-calendar mapper never set
 * DisplayAbbreviation for them, and Compact's renderer keys cell content off
 * that field. Seed data includes Therapy 7 (Marta, Wed, online CBT) so any
 * current-week Compact view must expose at least one "ONLINE" cell.
 */

import { setupTherapistCalendarForAdmin } from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Therapist Calendar COMPACT VIEW — online sessions', () => {
  beforeEach(() => {
    setupTherapistCalendarForAdmin();
  });

  it('TC_E2E_06: should render online sessions as an ONLINE cell in the Compact grid', () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    calendar.switchViewViaUrl('compact');

    // Compact view uses a plain <table>, not the rbc time grid.
    cy.get('table', { timeout: 15000 }).should('exist');

    // At least one cell in the current week must display the ONLINE abbreviation.
    // (Seed Therapy 7 is every Wednesday, so the current week always has one.)
    cy.contains('td', 'ONLINE', { timeout: 15000 }).should('exist');
  });
});
