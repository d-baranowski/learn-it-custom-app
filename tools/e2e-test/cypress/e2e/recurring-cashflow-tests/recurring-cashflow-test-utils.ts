/// <reference types="cypress" />

import { RecurringCashflowFormComponent } from '../components-objects/recurring-cashflow-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;

// Bootstrap recurring cashflows
export const BOOTSTRAP_CASHFLOWS = [
  { name: 'Office Rent', amount: '-2500' },
  { name: 'Cleaning Service', amount: '-300' },
  { name: 'Electricity Bill', amount: '-450' },
  { name: 'Water Bill', amount: '-150' },
  { name: 'Internet Bill', amount: '-120' },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

export { getTodayFormatted, getTomorrowFormatted } from '../../utils/date-utils';

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

export interface RecurringCashflowCreateOptions {
  name: string;
  amount: string;
  startDate?: string;
  endDate?: string;
  addSchedule?: boolean;
}

/**
 * Create a recurring cashflow via the form.
 * Assumes the Recurring Cashflow grid page is already open.
 */
export function createRecurringCashflowViaForm(options: RecurringCashflowCreateOptions): void {
  cylog('create recurring cashflow via form');
  const form = new RecurringCashflowFormComponent();
  const grid = new GridComponent();

  form.clickNew();
  form.waitForFormLoad();

  form.fillName(options.name);
  form.fillAmount(options.amount);

  if (options.startDate) {
    form.fillStartDate(options.startDate);
  }

  if (options.endDate) {
    form.fillEndDate(options.endDate);
  }

  if (options.addSchedule !== false) {
    form.addSchedule();
  }

  form.navigateToTab('Basic Information');
  form.submit();
  grid.waitForGrid();
  // Filter to this cashflow before asserting — the grid accumulates rows
  // without a DB reset and a freshly-created row can paginate off page 1.
  grid.search('filter-displayName', options.name);
  grid.waitForFetchSettled();
  grid.shouldContain(options.name);
  grid.clearSearch('filter-displayName');
  grid.waitForFetchSettled();
}

// ── Setup functions ──────────────────────────────────────────────────────────

export function setupRecurringCashflowTestForAdmin(): void {
  cylog('setup recurring cashflow test for admin');
  setupFor('admin', (nav) => nav.navigateToRecurringCashflow());
}

export function setupRecurringCashflowTestForAdam(): void {
  cylog('setup recurring cashflow test for adam');
  setupFor('adam', (nav) => nav.navigateToRecurringCashflow());
}
