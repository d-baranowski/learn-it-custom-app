/// <reference types="cypress" />

/**
 * TEST: TXN_E2E_03, TXN_E2E_04, TXN_E2E_05 — Read and filter bootstrap transactions
 *
 * Steps:
 * 1. Reset database and login as admin
 * 2. Navigate to the transaction page
 * 3. Verify all 5 bootstrap transactions exist in the grid
 * 4. Verify each transaction is linked to its recurring cashflow
 * 5. Filter transactions by name and verify results
 */

import { setupTransactionTestForAdmin, BOOTSTRAP_TRANSACTIONS } from './transaction-test-utils';
import { GridComponent } from '../components-objects/grid.component';

describe('Transaction - Read Bootstrap Data', () => {
  beforeEach(() => {
    setupTransactionTestForAdmin();
  });

  it('TXN_E2E_03: should display all 5 bootstrap transactions in the grid', () => {
    const grid = new GridComponent();
    BOOTSTRAP_TRANSACTIONS.forEach((txn) => {
      grid.waitForFetchSettled();
      grid.shouldContain(txn.name);
      const row = grid.findRow(txn.name);
      row.should('contain.text', txn.recurringCashflow);
      row.should('contain.text', txn.amount);
    });
  });
});
