/// <reference types="cypress" />

/**
 * TEST: TS_E2E_FILTER_01 — Filter therapist service grid by therapist
 *
 * Steps:
 * 1. Reset DB, login as admin, navigate to therapist service page
 * 2. Open the Filters panel via the filter toggle icon
 * 3. Type a therapist name in the Therapist filter
 * 4. Verify grid shows only rows for that therapist
 */

import { setupAsAdmin } from './therapist-service-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { FilterPanelComponent } from '../components-objects/filter-panel.component';

const FILTER_THERAPIST = 'Jan Nowak';

describe('Therapist Service - Filter by therapist', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('TS_E2E_FILTER_01: should filter grid by therapist name', () => {
    const grid = new GridComponent();

    // --- Wait for grid data to load ---
    grid.getVisibleRows().should('have.length.greaterThan', 0);

    // --- Open the Filters panel and wait for dialog ---
    cy.get('[data-testid="FilterAltIcon"]').click({ force: true });
    cy.get('[data-testid="dialog2-container"]', { timeout: 15000 }).should('be.visible');

    // The foreign-key relation filters via an autocomplete; the shared
    // component retries the open+type dance until options appear.
    new FilterPanelComponent().selectAutocompleteFilter('filter-therapistId', FILTER_THERAPIST);

    // Wait for the in-flight refetch to settle before asserting grid
    // content; otherwise the assertion may run against the pre-filter DOM.
    grid.waitForFetchSettled();

    // --- Verify grid shows only rows containing the filtered therapist ---
    grid.getVisibleRows().should('have.length.greaterThan', 0);
    grid.shouldContain(FILTER_THERAPIST);

    // --- Close the filter dialog ---
    cy.get('[data-testid="dialog2-container"]')
      .find('[data-testid="CloseIcon"]')
      .first()
      .click();
  });
});
