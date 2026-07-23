/// <reference types="cypress" />

/**
 * RCF_E2E_01 — Admin creates 2 recurring cashflows (income + expense)
 */

import {
  loginAsAdmin,
  createRecurringCashflowViaForm,
  getTodayFormatted,
} from './recurring-cashflow-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniqueName } from '../../utils/unique';

describe('Recurring Cashflow CREATE Tests (Admin) — RCF_E2E_01', () => {
  beforeEach(() => {
    loginAsAdmin();
    new NavigationHelper().navigateToRecurringCashflow();
  });

  it('RCF_E2E_01: should create a positive income and negative expense, verify both in grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const incomeName = uniqueName('Monthly Consulting Income');
    const expenseName = uniqueName('Office Supplies Expense');

    // Verify we are on the Recurring Cashflows page
    nav.verifyBreadcrumb('Recurring Cashflows');
    grid.waitForGrid();

    // --- Create positive income cashflow ---
    createRecurringCashflowViaForm({
      name: incomeName,
      amount: '5000',
      startDate: getTodayFormatted(),
    });

    // Verify income cashflow row (filter so it's on-screen and amount is scoped)
    grid.search('filter-displayName', incomeName);
    grid.waitForFetchSettled();
    grid.findRow(incomeName).should('contain.text', '5000');

    // --- Create negative expense cashflow ---
    createRecurringCashflowViaForm({
      name: expenseName,
      amount: '-200',
      startDate: getTodayFormatted(),
    });

    // Verify expense cashflow row
    grid.search('filter-displayName', expenseName);
    grid.waitForFetchSettled();
    grid.findRow(expenseName).should('contain.text', '-200');

    // Re-verify the income row still exists after the expense was created, so
    // both created cashflows are confirmed to coexist. Scoped by run-unique name
    // rather than a total-row count — the old `be.gte(7)` assumed 5 bootstrap
    // seed rows that age out of the grid's date-relative view.
    grid.clearSearch('filter-displayName');
    grid.search('filter-displayName', incomeName);
    grid.waitForFetchSettled();
    grid.shouldContain(incomeName);
  });

  it('RCF_E2E_02: should create a cashflow with end date and verify it in grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const contractName = uniqueName('Temporary Contract');

    grid.waitForGrid();

    // Create cashflow with both start and end dates
    createRecurringCashflowViaForm({
      name: contractName,
      amount: '1500',
      startDate: '01/01/2026',
      endDate: '31/12/2026',
    });

    // Verify in grid
    grid.search('filter-displayName', contractName);
    grid.waitForFetchSettled();
    grid.findRow(contractName).should('contain.text', '1500');
  });
});
