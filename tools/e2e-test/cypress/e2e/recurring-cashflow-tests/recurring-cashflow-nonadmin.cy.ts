/// <reference types="cypress" />

/**
 * RCF_E2E_08 — Non-admin (Adam) access restrictions for Recurring Cashflows
 *
 * Adam gets 403 on RecurringCashflowService/List, so the grid is empty.
 * These tests verify the page loads and the non-admin restrictions are enforced.
 */

import { setupRecurringCashflowTestForAdam } from './recurring-cashflow-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Recurring Cashflow NON-ADMIN Tests (Adam) — RCF_E2E_08', () => {
  beforeEach(() => {
    setupRecurringCashflowTestForAdam();
  });

  it('RCF_E2E_08: non-admin should be able to access the Recurring Cashflow page', () => {
    const nav = new NavigationHelper();
    const grid = new GridComponent();

    // Verify breadcrumb
    nav.verifyBreadcrumb('Recurring Cashflows');
    grid.waitForGrid();
  });

  it('RCF_E2E_09: non-admin should not see the New button', () => {
    // Verify the "New" button does NOT exist for non-admin
    cy.get('[data-testid="create-item-btn"]').should('not.exist');
  });

  it('RCF_E2E_10: non-admin grid should show no records due to permission restrictions', () => {
    const grid = new GridComponent();

    grid.waitForGrid();

    // Adam gets 403 on RecurringCashflowService/List — grid shows 0-0 of 0
    cy.contains('0-0 of 0', { timeout: 10000 }).should('be.visible');
  });
});
