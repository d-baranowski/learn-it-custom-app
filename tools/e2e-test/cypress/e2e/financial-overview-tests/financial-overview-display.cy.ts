/// <reference types="cypress" />

/**
 * FIN_E2E_01 — Financial Overview page loads with chart
 * FIN_E2E_02 — Chart has month labels on X-axis
 * FIN_E2E_03 — Non-admin user sees permission error on Financial Overview
 *
 * Steps:
 * 1. Reset DB and login.
 * 2. Navigate to Financial Overview page.
 * 3. Verify "Monthly Income Overview" heading is visible.
 * 4. Verify Recharts elements render (surface, bars, axis ticks).
 * 5. Repeat for non-admin user.
 */

import {
  setupFinancialOverviewForAdmin,
  setupFinancialOverviewForAdam,
} from './financial-overview-test-utils';

describe('Financial Overview - Display Tests', () => {
  it('FIN_E2E_01: should display the Financial Overview page with chart', () => {
    setupFinancialOverviewForAdmin();

    // Verify the page heading
    cy.contains('Monthly Income Overview').should('be.visible');

    // Verify Recharts surface renders
    cy.get('.recharts-surface', { timeout: 15000 }).should('exist');

    // Verify at least one bar rectangle exists (bootstrap data generates transactions)
    cy.get('.recharts-bar-rectangle').should('have.length.greaterThan', 0);
  });

  it('FIN_E2E_02: should display month labels on the X-axis', () => {
    setupFinancialOverviewForAdmin();

    cy.get('.recharts-surface', { timeout: 15000 }).should('exist');

    // Verify axis tick values exist (month labels on X-axis)
    cy.get('.recharts-cartesian-axis-tick-value').should('have.length.greaterThan', 0);

    // Verify at least one recognizable month abbreviation is present
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    cy.get('.recharts-cartesian-axis-tick-value').then(($ticks) => {
      const tickTexts = Array.from($ticks).map((el) => el.textContent?.trim() ?? '');
      const hasMonth = tickTexts.some((text) => monthNames.some((month) => text.includes(month)));
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(hasMonth).to.be.true;
    });
  });

  it('FIN_E2E_03: non-admin user can access Financial Overview page', () => {
    setupFinancialOverviewForAdam();

    // Verify the page heading is still visible
    cy.contains('Monthly Income Overview').should('be.visible');

    // Non-admin (Adam) gets 403 on FinancialDashboardService/GetFinancialOverview,
    // so the page renders the heading but shows an error / empty chart.
    // Verify the page shows a permission-denied error message.
    cy.contains('Failed to load financial data', { timeout: 15000 }).should('be.visible');
  });
});
