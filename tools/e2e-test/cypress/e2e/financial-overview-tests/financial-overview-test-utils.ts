/// <reference types="cypress" />

import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;

// ── Login helpers ──────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

// ── Setup functions ──────────────────────────────────────────────────────────

export function setupFinancialOverviewForAdmin(): void {
  cylog('setup financial overview for admin');
  setupFor('admin', (nav) => nav.navigateToFinancialOverview());
}

export function setupFinancialOverviewForAdam(): void {
  cylog('setup financial overview for adam');
  setupFor('adam', (nav) => nav.navigateToFinancialOverview());
}
