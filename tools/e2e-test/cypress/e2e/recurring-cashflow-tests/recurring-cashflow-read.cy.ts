/// <reference types="cypress" />

/**
 * RCF_E2E_03 — Verify bootstrap data, filter by name, verify amounts
 */

import { loginAsAdmin, BOOTSTRAP_CASHFLOWS } from './recurring-cashflow-test-utils';
import { RecurringCashflowFormComponent } from '../components-objects/recurring-cashflow-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Recurring Cashflow READ Tests — RCF_E2E_03', () => {
  beforeEach(() => {
    loginAsAdmin();
    new NavigationHelper().navigateToRecurringCashflow();
  });

  it('RCF_E2E_03: should display all 5 bootstrap recurring cashflows', () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();

    // Verify breadcrumb
    nav.verifyBreadcrumb('Recurring Cashflows');
    grid.waitForGrid();

    // The grid accumulates cashflows created by other specs, so assert each
    // bootstrap row is PRESENT (by filtering to its name) rather than that the
    // grid holds exactly 5 rows.
    for (const cashflow of BOOTSTRAP_CASHFLOWS) {
      grid.search('filter-displayName', cashflow.name);
      grid.waitForFetchSettled();
      grid.shouldContain(cashflow.name);
      grid.clearSearch('filter-displayName');
      grid.waitForFetchSettled();
    }
  });

  it('RCF_E2E_04: should verify bootstrap cashflow amounts', () => {
    const grid = new GridComponent();

    grid.waitForGrid();

    // Filter to each bootstrap cashflow so its row is on-screen, then verify
    // its amount appears on that row.
    for (const cashflow of BOOTSTRAP_CASHFLOWS) {
      grid.search('filter-displayName', cashflow.name);
      grid.waitForFetchSettled();
      grid.findRow(cashflow.name).should('contain.text', cashflow.amount);
      grid.clearSearch('filter-displayName');
      grid.waitForFetchSettled();
    }
  });

  it('RCF_E2E_05: should open a cashflow for viewing via double-click', () => {
    const grid = new GridComponent();
    const form = new RecurringCashflowFormComponent();

    grid.waitForGrid();

    // Filter to Office Rent before opening — the grid accumulates rows.
    grid.search('filter-displayName', 'Office Rent');
    grid.waitForFetchSettled();
    grid.openRow('Office Rent');
    form.waitForFormLoad();

    // Verify form fields have correct values
    form.shouldHaveInputValue('display-name', 'Office Rent');

    // Close the form
    form.cancel();
  });

  it('RCF_E2E_06: should verify all bootstrap cashflows are negative expenses', () => {
    const grid = new GridComponent();

    grid.waitForGrid();

    // Filter to each bootstrap cashflow and verify its (negative) amount on the
    // row — bare amount strings would otherwise collide with accumulated rows.
    for (const cashflow of BOOTSTRAP_CASHFLOWS) {
      grid.search('filter-displayName', cashflow.name);
      grid.waitForFetchSettled();
      grid.findRow(cashflow.name).should('contain.text', cashflow.amount);
      grid.clearSearch('filter-displayName');
      grid.waitForFetchSettled();
    }
  });
});
