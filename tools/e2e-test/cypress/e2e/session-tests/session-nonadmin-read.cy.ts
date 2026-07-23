/// <reference types="cypress" />

/**
 * SES_E2E_02 — Non-admin (Adam) sees only his own sessions
 *
 * Steps:
 * 1. Admin creates both sessions (setup).
 * 2. Login as Adam, navigate to Session page.
 * 3. Adjust date filters to include tomorrow.
 * 4. Verify only Adam's session is visible — Marta's is hidden.
 */

import {
  setupAdminWithTwoSessions,
  loginAsAdam,
  adjustDateFiltersForTomorrow,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Session NON-ADMIN READ Tests (Adam)', () => {
  beforeEach(() => {
    setupAdminWithTwoSessions();

    // Switch to Adam
    loginAsAdam();
    new NavigationHelper().navigateToSession();
    adjustDateFiltersForTomorrow();
  });

  it("SES_E2E_02: should show only Adam's sessions and hide Marta's", { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();

    nav.verifyBreadcrumb('Session');

    // Verify Adam's session is visible
    grid.shouldContain('Adam');
    grid.shouldContain('B1');

    // Verify Marta's session is NOT visible
    grid.shouldNotContain('Marta');
  });
});
