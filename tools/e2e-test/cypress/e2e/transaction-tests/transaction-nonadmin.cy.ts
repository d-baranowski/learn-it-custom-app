/// <reference types="cypress" />

/**
 * TEST: TXN_E2E_06, TXN_E2E_07 — Non-admin (Adam) transaction restrictions
 *
 * Steps:
 * 1. Reset database and login as Adam (non-admin therapist)
 * 2. Navigate to the transaction page
 * 3. Verify Adam can access the page (non-admin gets 403 on TransactionService/List,
 *    so the grid renders but shows "0-0 of 0" with no data)
 * 4. Verify the "New" button does NOT exist (non-admin cannot create)
 */

import { setupTransactionTestForAdam } from './transaction-test-utils';
import { TransactionFormComponent } from '../components-objects/transaction-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Transaction - Non-Admin Restrictions', () => {
  beforeEach(() => {
    setupTransactionTestForAdam();
  });

  it('TXN_E2E_06: non-admin should be able to access the transaction page', () => {
    const nav = new NavigationHelper();

    // Verify breadcrumb shows Transactions
    nav.verifyBreadcrumb('Transactions');

    // Non-admin (Adam) gets 403 on TransactionService/List,
    // so the grid renders empty with "0-0 of 0" pagination text.
    cy.contains('0-0 of 0', { timeout: 15000 }).should('be.visible');
  });

  it('TXN_E2E_07: non-admin should not see the New button', () => {
    const form = new TransactionFormComponent();

    // Verify the "New" / create button does NOT exist for non-admin
    cy.get(form.selectors.newButton).should('not.exist');
  });
});
