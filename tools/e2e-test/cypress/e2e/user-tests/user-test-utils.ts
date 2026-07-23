/// <reference types="cypress" />

import { UserFormComponent } from '../components-objects/user-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { generateRandomString, uniqueEmail, uniqueToken } from '../../utils/unique';

export interface UserData {
  displayName: string;
  username: string;
  email: string;
  abbreviation?: string;
}

/**
 * Build a user whose displayName, username and email are unique to this run so
 * update/delete assertions can scope to it against the shared, accumulating DB.
 * username is kept alphanumeric (no dashes) to satisfy the field's constraints.
 * Call inside `beforeEach`/`it`, never at module scope.
 */
export function makeUser(displayBase: string, abbreviation?: string): UserData {
  const token = uniqueToken();
  const slug = displayBase.toLowerCase().replace(/\s+/g, '');
  return {
    displayName: `${displayBase} ${token}`,
    username: `${slug}${Date.now().toString(36)}${generateRandomString(4)}`.toLowerCase(),
    email: uniqueEmail(slug),
    abbreviation: abbreviation+token,
  };
}

export const makeUserAlpha = (): UserData => makeUser('Test User Alpha', 'TUA');
export const makeUserBravo = (): UserData => makeUser('Test User Bravo', 'TUB');

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

/** Login as admin and navigate to the Users page */
export function setupUserTestForAdmin(): void {
  cylog('setup user test for admin');
  setupFor('admin', (nav) => nav.navigateToUsers());
}

/**
 * Create a single user via the Users page form.
 * Assumes the Users grid page is already open.
 */
export function createUser(data: UserData): void {
  cylog('create user');
  const form = new UserFormComponent();
  const grid = new GridComponent();

  form.clickNew();
  form.fillUserDetails(
    {
      displayName: data.displayName,
      username: data.username,
      email: data.email,
      abbreviation: data.abbreviation,
    },
    false
  );
  form.submit();
  grid.waitForGrid();
  // Filter to this run's user before asserting: without a DB reset the grid
  // accumulates rows and a freshly-created user can paginate off page 1.
  grid.search('filter-displayName', data.displayName);
  grid.waitForFetchSettled();
  grid.shouldContain(data.displayName);
  grid.clearSearch('filter-displayName');
  grid.waitForFetchSettled();
}
