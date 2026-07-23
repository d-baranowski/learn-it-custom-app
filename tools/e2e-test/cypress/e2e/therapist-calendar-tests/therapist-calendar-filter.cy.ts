/// <reference types="cypress" />

/**
 * TC_E2E_04 — Admin filters Therapist Calendar via inline toolbar filters
 *
 * Also owns TC_E2E_01's unfiltered-view assertions (named multi-therapist
 * column headers + events) — the standalone admin-view spec was removed
 * since this test starts from the identical unfiltered state.
 */

import {
  setupTherapistCalendarForAdmin,
  ADAM_FULL_NAME,
  ADAM_ABBREVIATION,
  THERAPIST_ABBREVIATIONS,
} from './therapist-calendar-test-utils';
import { CalendarComponent } from '../components-objects/calendar.component';

describe('Therapist Calendar ADMIN FILTER', () => {
  beforeEach(() => {
    setupTherapistCalendarForAdmin();
  });

  it('TC_E2E_04: should filter therapist calendar by a specific therapist', () => {
    const calendar = new CalendarComponent();

    calendar.waitForCalendar();
    calendar.waitForEvents();

    cy.get('.rbc-row.rbc-row-resource .rbc-header').should('have.length.greaterThan', 1);
    calendar.shouldHaveColumnHeader(THERAPIST_ABBREVIATIONS[0]); // AH
    calendar.shouldHaveColumnHeader(THERAPIST_ABBREVIATIONS[3]); // AR
    calendar.getEventCount().should('be.greaterThan', 0);

    calendar.openTherapistFilter();
    calendar.clickTherapistFilterClear();
    calendar.selectTherapistInFilter(ADAM_FULL_NAME);
    calendar.closeFilterPopover();

    // eslint-disable-next-line no-restricted-syntax -- post-filter: exactly one therapist column remains when filtered to a single therapist
    cy.get('.rbc-row.rbc-row-resource .rbc-header', { timeout: 10000 })
      .should('have.length', 1)
      .and('contain.text', ADAM_ABBREVIATION);

    calendar.openTherapistFilter();
    calendar.selectTherapistInFilter(ADAM_FULL_NAME);
    calendar.closeFilterPopover();

    cy.get('.rbc-row.rbc-row-resource .rbc-header', { timeout: 10000 }).should(
      'have.length.greaterThan',
      1
    );
  });
});
