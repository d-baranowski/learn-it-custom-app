/// <reference types="cypress" />

/**
 * UTR-000161 — Right-click "Filter by this value" on grid cells
 *
 * On the Therapy grid, right-clicking a Therapist label cell offers
 * "Filter by Therapist: <name>" which filters by the underlying therapistId
 * (not the label string). Quick filters / filters modal share the same
 * Redux state so they reflect the new filter automatically.
 */

import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Therapy CONTEXT MENU FILTER', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.login();
    new NavigationHelper().navigateToTherapy();
  });

  it('THPY_CTX_E2E_01: right-click on Therapist cell filters by therapistId', () => {
    const grid = new TherapyGrid();
    grid.waitForGrid();
    grid.waitForRowsLoaded();

    // Wait for real data and any in-flight fetches to settle, then capture
    // the therapist name. Re-query the DOM for every interaction to avoid
    // stale-element detachment from late re-renders.
    grid.waitForRowsLoaded();
    grid.waitForFetchSettled();

    cy.get('[data-testid="rpg-grid-component-wrapper"]')
      .contains('tbody tr td', /Hałaczkiewicz|Nowak|Radecka|Kuczek/i, {
        timeout: 30000,
      })
      .invoke('text')
      .then((rawText) => rawText.trim())
      .then((therapistLabel) => {
      expect(therapistLabel, 'Therapist cell must have a value').to.not.be.empty;

      cy.get('[data-testid="rpg-grid-component-wrapper"]')
        .contains('tbody tr td', therapistLabel)
        .rightclick({ force: true });

      cy.get('[data-testid="context-menu-filter-by"]', { timeout: 5000 })
        .should('be.visible')
        .and('contain.text', therapistLabel)
        .click({ force: true });

      // Filter applied — every visible row should still show the same
      // therapist label (the filter targets therapistId, but each matching
      // row still renders the same label string).
      grid.waitForRowsLoaded();
      cy.get('[data-testid="rpg-grid-component-wrapper"]')
        .find('tbody tr[data-id]')
        .should('have.length.gte', 1)
        .each(($row) => {
          expect($row.text()).to.contain(therapistLabel);
        });

      // Right-click any populated cell and clear filters via the menu.
      grid.waitForFetchSettled();
      cy.get('[data-testid="rpg-grid-component-wrapper"]')
        .find('tbody tr[data-id]')
        .first()
        .contains('td', therapistLabel)
        .rightclick({ force: true });
      cy.get('[data-testid="context-menu-clear-filters"]', { timeout: 5000 })
        .click({ force: true });
      grid.waitForRowsLoaded();
    });
  });
});
