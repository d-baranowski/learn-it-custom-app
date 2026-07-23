/// <reference types="cypress" />

/**
 * TEST: TXN_E2E_01, TXN_E2E_02 — Admin creates transactions
 *
 * Steps:
 * 1. Reset database and login as admin
 * 2. Navigate to the transaction page
 * 3. Create an expense transaction (negative amount)
 * 4. Verify it appears in the grid
 * 5. Create an income transaction (positive amount)
 * 6. Verify it appears in the grid
 */

import {
  setupTransactionTestForAdmin,
  createTransactionViaForm,
  getTodayFormatted,
} from './transaction-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { uniqueName } from '../../utils/unique';

describe('Transaction - Create as Admin', () => {
  beforeEach(() => {
    setupTransactionTestForAdmin();
  });

  it('TXN_E2E_01: should create an expense transaction and verify it in the grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const today = getTodayFormatted();
    const expenseName = uniqueName('Office Supplies');

    createTransactionViaForm({
      name: expenseName,
      amount: '-350',
      incurredAt: today,
    });

    // Filter to this run's transaction before asserting on the row.
    grid.search('filter-displayName', expenseName);
    grid.waitForFetchSettled();
    grid.shouldContain(expenseName);
    grid.findRow(expenseName).should('contain.text', '-350');
  });

  it('TXN_E2E_02: should create an income transaction and verify it in the grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const today = getTodayFormatted();
    const expenseName = uniqueName('Equipment Purchase');
    const incomeName = uniqueName('Client Payment');

    // Create an expense first
    createTransactionViaForm({
      name: expenseName,
      amount: '-800',
      incurredAt: today,
    });

    // Create an income transaction
    createTransactionViaForm({
      name: incomeName,
      amount: '5000',
      incurredAt: today,
    });

    // Verify the income row has the correct amount
    grid.search('filter-displayName', incomeName);
    grid.waitForFetchSettled();
    grid.findRow(incomeName).should('contain.text', '5000');

    // Verify the expense row has the correct amount
    grid.search('filter-displayName', expenseName);
    grid.waitForFetchSettled();
    grid.findRow(expenseName).should('contain.text', '-800');
  });
});
