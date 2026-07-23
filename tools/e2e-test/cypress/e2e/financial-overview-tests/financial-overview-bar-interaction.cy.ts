/// <reference types="cypress" />

/**
 * FIN_E2E_05 — Clicking a bar shows the monthly detail section
 *
 * Steps:
 * 1. Reset DB and login as admin.
 * 2. Navigate to Financial Overview.
 * 3. Click the first bar in the chart.
 * 4. Verify "Income Breakdown" and "Month Summary" (with "Total Income") appear.
 *
 * FIN_E2E_04 was a strict prefix of this test (same commands minus the
 * Total Income assertion) and was folded in; FIN_E2E_06 duplicated
 * FIN_E2E_03 (financial-overview-display.cy.ts) verbatim and was removed.
 */

import { setupFinancialOverviewForAdmin } from './financial-overview-test-utils';

describe('Financial Overview - Bar Interaction Tests', () => {
  it('FIN_E2E_05: clicking a bar shows income breakdown and month summary', () => {
    setupFinancialOverviewForAdmin();

    cy.get('.recharts-surface', { timeout: 30000 }).should('exist');
    cy.get('.recharts-bar-rectangle', { timeout: 15000 }).should('have.length.greaterThan', 0);

    // Click the first bar to show details
    cy.get('.recharts-bar-rectangle').first().click({ force: true });

    // The detail section shows "Income Breakdown" (a chart by therapist)
    // and "Month Summary" (total income and per-therapist breakdown).
    cy.contains('Income Breakdown', { timeout: 15000 }).should('be.visible');
    cy.contains('Month Summary', { timeout: 15000 }).should('be.visible');

    // Verify the month summary shows a "Total Income" label
    cy.contains('Total Income', { timeout: 10000 }).should('be.visible');
  });
});
