/// <reference types="cypress" />

/**
 * USR_E2E_REG — Regression coverage for UTR-000199 ("creating users is broken").
 *
 * The card was filed without a specific repro. The base happy-path
 * (USR_E2E_01) already covers create-with-all-fields, so this file targets
 * the surfaces most likely to regress silently after the recent forms /
 * grid framework changes:
 *
 *   a) Create with ONLY required fields (no avatar, no abbreviation, no
 *      disabled toggle). Verifies the SaveUserRequest accepts an empty
 *      avatar/abbreviation and the optimistic list patch tolerates the
 *      missing optional fields.
 *
 *   b) Create then immediately re-open the new row in edit mode. Verifies
 *      the freshly-created entity hydrates the form (regression guard for
 *      the same class of bug fixed in THR_E2E_SES_EDIT — entity not
 *      loading after create).
 */

import {
  setupUserTestForAdmin,
  makeUser,
} from './user-test-utils';
import { UserFormComponent } from '../components-objects/user-form.component';
import { GridComponent } from '../components-objects/grid.component';

describe('User CREATE Regression (UTR-000199)', () => {
  beforeEach(() => {
    setupUserTestForAdmin();
  });

  it('USR_E2E_REG_01: should create a user with only required fields', { tags: '@mutating' }, () => {
    const form = new UserFormComponent();
    const grid = new GridComponent();
    const { displayName, username, email } = makeUser('Min Required');

    grid.waitForGrid();

    form.clickNew();
    form.waitForFormLoad();
    form.fillUserDetails({ displayName, username, email }, false);
    form.submit();

    grid.waitForGrid();
    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName);
  });

  it('USR_E2E_REG_02: created user can be re-opened in edit mode and hydrates the form', { tags: '@mutating' }, () => {
    const form = new UserFormComponent();
    const grid = new GridComponent();
    const { displayName, username, email } = makeUser('Test User Alpha', 'EDT');

    grid.waitForGrid();

    form.clickNew();
    form.waitForFormLoad();
    form.fillUserDetails(
      { displayName, username, email, abbreviation: 'EDT' },
      false,
    );
    form.submit();

    grid.waitForGrid();
    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName);

    grid.openRow(displayName);
    form.waitForFormLoad();
    form.shouldHaveDisplayName(displayName);
    form.shouldHaveUsername(username);
    form.shouldHaveEmail(email);
    form.shouldHaveAbbreviation('EDT');
    form.cancel();
  });
});
