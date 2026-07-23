/// <reference types="cypress" />

import { TransactionFormComponent } from '../components-objects/transaction-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;

// Bootstrap transactions (generated from recurring cashflows)
export const BOOTSTRAP_TRANSACTIONS = [
  { recurringCashflow: 'Office Rent', name: 'Office Rent - January 2024', amount: '-2500' },
  { recurringCashflow: 'Internet Bill', name: 'Internet Bill - January 2024', amount: '-120' },
  {
    recurringCashflow: 'Electricity Bill',
    name: 'Electricity Bill - January 2024',
    amount: '-450',
  },
  { recurringCashflow: 'Water Bill', name: 'Water Bill - January 2024', amount: '-150' },
  {
    recurringCashflow: 'Cleaning Service',
    name: 'Cleaning Service - January 5, 2024',
    amount: '-300',
  },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

export { getTodayFormatted } from '../../utils/date-utils';

// ── Login helpers ──────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

// ── Creation helpers ──────────────────────────────────────────────────────────

export interface TransactionCreateOptions {
  name: string;
  amount: string;
  incurredAt: string;
}

/**
 * Create a transaction via the form.
 * Assumes the Transaction grid page is already open.
 */
export function createTransactionViaForm(options: TransactionCreateOptions): void {
  cylog('create transaction via form');
  const form = new TransactionFormComponent();
  const grid = new GridComponent();

  form.clickNew();
  form.waitForFormLoad();

  form.fillName(options.name);
  form.fillAmount(options.amount);
  form.fillIncurredAt(options.incurredAt);

  form.submit();
  grid.waitForGrid();
  // Filter to this transaction before asserting — the grid accumulates rows
  // without a DB reset and a freshly-created row can paginate off page 1.
  grid.search('filter-displayName', options.name);
  grid.waitForFetchSettled();
  grid.shouldContain(options.name);
  grid.clearSearch('filter-displayName');
  grid.waitForFetchSettled();
}

// ── Setup functions ──────────────────────────────────────────────────────────

export function setupTransactionTestForAdmin(): void {
  cylog('setup transaction test for admin');
  setupFor('admin', (nav) => nav.navigateToTransaction());
}

export function setupTransactionTestForAdam(): void {
  cylog('setup transaction test for adam');
  setupFor('adam', (nav) => nav.navigateToTransaction());
}
