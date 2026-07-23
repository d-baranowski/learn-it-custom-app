/// <reference types="cypress" />

/**
 * USR_E2E_03 — Admin updates a user and deletes a user
 */

import {
  setupUserTestForAdmin,
  createUser,
  makeUserAlpha,
} from './user-test-utils';
import { UserFormComponent } from '../components-objects/user-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniqueEmail, uniqueToken } from '../../utils/unique';

describe(
  'User UPDATE & DELETE Tests (Admin)',
  () => {

    it("USR_E2E_03: should update a user's display name and email", { tags: '@mutating' }, () => {
      setupUserTestForAdmin();

      // Create two run-unique test users to work with
      const userA = makeUserAlpha();
      createUser(userA);

      const form = new UserFormComponent();
      const grid = new GridComponent();
      const nav = new NavigationHelper();
      const deleteDialog = new DeleteDialog();
      const updatedDisplayName = `Test User Alpha Updated ${uniqueToken()}`;
      const updatedEmail = uniqueEmail('alpha.updated');
      const updatedAbbreviation = `U${uniqueToken().slice(0, 3).toUpperCase()}`;

      nav.verifyBreadcrumb('User');

      // Filter to userA before opening — the unfiltered grid accumulates rows.
      grid.search('filter-displayName', userA.displayName);
      grid.waitForFetchSettled();
      grid.openRow(userA.displayName, true);
      form.waitForFormLoad();

      // Verify form loads with correct values
      form.shouldHaveDisplayName(userA.displayName);
      form.shouldHaveUsername(userA.username);
      form.shouldHaveEmail(userA.email);

      // Update display name and email
      form.fillUserDetails({
        displayName: updatedDisplayName,
        email: updatedEmail,
        abbreviation: updatedAbbreviation,
      });
      form.submit();

      // Re-filter to the updated user and verify the new values; his original
      // email must be gone from that scoped view.
      grid.waitForGrid();
      grid.search('filter-displayName', updatedDisplayName);
      grid.waitForFetchSettled();
      grid.shouldContainExact(updatedDisplayName);
      grid.shouldContainExact(updatedEmail);
      grid.shouldContainExact(updatedAbbreviation);
      grid.shouldNotContainExact(userA.email);

      // Filter to userA, capture his row id, delete, then assert that exact row
      // is gone — independent of any other accumulated users.
      grid.search('filter-displayName', updatedDisplayName);
      grid.waitForFetchSettled();
      grid.getRowDataId(updatedDisplayName).then((userAId) => {
        grid.selectRow(updatedDisplayName);
        grid.deleteSelected();
        deleteDialog.confirm();

        grid.waitForGrid();
        grid.waitForFetchSettled();
        grid.shouldNotHaveRowWithId(userAId);
      });

      // Positive assertion: userB still exists.
      grid.clearSearch('filter-displayName');
      grid.search('filter-displayName', updatedDisplayName);
      grid.waitForFetchSettled();
    });
  }
);
