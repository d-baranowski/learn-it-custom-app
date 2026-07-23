/// <reference types="cypress" />

/**
 * USR_E2E_01 — Admin creates 2 users
 */

import {
  setupUserTestForAdmin,
  createUser,
  makeUserAlpha,
  makeUserBravo,
} from './user-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('User CREATE Tests (Admin)', () => {
  beforeEach(() => {
    setupUserTestForAdmin();
  });

  it('USR_E2E_01: should create two users and verify both appear in grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const userA = makeUserAlpha();
    const userB = makeUserBravo();

    nav.verifyBreadcrumb('User');
    grid.waitForGrid();

    // createUser filters to each user's unique displayName before asserting.
    createUser(userA);
    createUser(userB);

    grid.getRowCount().should('be.gte', 3); // admin + 2 new users
  });

  // USR_E2E_02 (fill-then-cancel) migrated to jest — user_form.test.tsx
  // 'calls onCancel when cancel button is clicked'.
});
