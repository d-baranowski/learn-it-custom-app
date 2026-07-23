/// <reference types="cypress" />

/**
 * TEST: THR_FILTER_E2E_04 — Filter therapists by Professional Title (quick filter)
 *
 * Regression test for UTR-000119: "Tytul zawodowy quick filter renders nothing"
 * The bug was caused by:
 *   1. `ITranslatedString` not being registered in the frontend filter builder's
 *      colTypes map, so no filter component was rendered.
 *   2. The backend model parser not detecting pointer-to-struct fields (e.g.
 *      *TranslatedString) as JSONB, causing a PostgreSQL error:
 *      "operator does not exist: jsonb ~~* unknown".
 *   3. The where-builder path calculation leaving the path as "professionalTitle"
 *      instead of "" for a root-level JSONB field, generating an invalid accessor.
 *
 * Steps:
 * 1. Login as admin, navigate to therapist page
 * 2. Verify the Professional Title quick filter renders above the grid
 * 3. Type a search term that matches known seeded data ("Clinical")
 * 4. Wait for the TherapistService/List API call to succeed (no 500 crash)
 * 5. Verify that every visible row contains the search term in the Professional
 *    Title column
 * 6. Clear the filter and verify the full list is restored
 */

import { navigateToTherapistPage } from './therapist-test-utils';
import { GridComponent } from '../components-objects/grid.component';

describe('Therapist - Filter by Professional Title (quick filter)', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('POST', '**/core.v1.TherapistService/List').as('therapistList');
    navigateToTherapistPage();
    cy.wait('@therapistList');
  });

  it('THR_FILTER_E2E_04: should render the Professional Title quick filter and filter results without crashing', () => {
    const grid = new GridComponent();

    // --- Verify grid has data before filtering ---
    grid.getVisibleRows().should('have.length.greaterThan', 0);
    grid.getVisibleRows().its('length').as('totalRows');

    // --- Verify the Professional Title quick filter renders (regression: was blank) ---
    cy.get('input[data-testid="filter-professionalTitle"]')
      .should('exist')
      .and('be.visible');

    // --- Dynamically find the Professional Title column index ---
    cy.window().then((win) => {
      const gridEl = win.document.querySelector('[data-testid="rpg-grid-component-wrapper"]');
      const ths = gridEl!.querySelectorAll('thead th');
      let colNth = -1;
      ths.forEach((th) => {
        const wrapper = th.querySelector('.Mui-TableHeadCell-Content-Wrapper');
        if (wrapper && wrapper.textContent?.trim() === 'Professional Title') {
          colNth = (th as HTMLTableCellElement).cellIndex + 1;
        }
      });
      expect(colNth, 'Professional Title column should exist').to.be.greaterThan(0);
      cy.wrap(colNth).as('colNth');
    });

    // --- Type "Clinical" in the quick filter and wait for API (regression: was 500) ---
    cy.intercept('POST', '**/core.v1.TherapistService/List').as('filteredList');
    grid.search('filter-professionalTitle', 'Clinical');
    cy.wait('@filteredList', { timeout: 30000 });

    // --- Verify filtered rows all contain "Clinical" in the Professional Title column ---
    // Single cy.get + should-with-callback. Cypress re-runs the whole
    // chain (incl. the cy.get) if the should callback throws, so any
    // mid-action re-render of the table just resolves on the retry.
    // Avoids the per-iteration stale-DOM-ref problems of `.each` over
    // a snapshot collection AND the `.eq(i).find(...)` chain that doesn't
    // re-query after table re-renders.
    grid.getVisibleRows().should('have.length.greaterThan', 0);
    cy.get('@colNth').then((colNth) => {
      cy.get(
        `[data-testid="rpg-grid-component-wrapper"] tbody tr td:nth-child(${colNth})`
      ).should(($cells) => {
        expect($cells.length, 'at least one filtered row').to.be.greaterThan(0);
        $cells.each((_, cell) => {
          expect(cell.textContent, 'every cell contains Clinical').to.contain('Clinical');
        });
      });
    });

    // --- Clear filter and verify the full list is restored ---
    // Clearing a text filter to empty is handled client-side without a new
    // API request, so we assert on the row count directly rather than waiting
    // on an intercept alias.
    cy.get('input[data-testid="filter-professionalTitle"]').clear();

    cy.get('@totalRows').then((totalRows) => {
      grid.getVisibleRows().should('have.length', totalRows as unknown as number, { timeout: 30000 });
    });
  });
});
