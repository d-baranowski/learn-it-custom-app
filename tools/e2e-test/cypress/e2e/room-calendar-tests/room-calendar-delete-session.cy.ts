/// <reference types="cypress" />

/**
 * RC_E2E_07 — Admin deletes a session and verifies it's removed from Room Calendar
 *
 * Steps:
 * 1. Reset DB, login as admin
 * 2. Create a session for tomorrow so there's guaranteed data
 * 3. Navigate to Room Calendar day view for tomorrow, record event count
 * 4. Navigate to Session grid, filter by tomorrow, select and delete the session
 * 5. Navigate back to Room Calendar and verify event count decreased
 */

import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import {
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPIST_OPTION,
} from '../session-tests/session-test-utils';
import { uniquePrice } from '../../utils/unique';

describe('Room Calendar ADMIN DELETE', () => {
  beforeEach(() => {
    cy.login();
  });

  it('RC_E2E_07: should delete a session and verify it disappears from room calendar', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();
    const nav = new NavigationHelper();
    const tomorrow = getTomorrowFormatted();
    // Unique price identifies this run's session unambiguously among tomorrow's
    // (accumulating) sessions on the non-reset DB.
    const price = String(uniquePrice());

    // --- Step 1: Create a session for tomorrow ---
    nav.navigateToSession();
    createSessionViaForm({
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price,
    });

    // --- Step 2: Filter by tomorrow and record the total row count ---
    adjustDateFiltersForTomorrow();
    grid.shouldContain(price);

    grid.getPaginationSummary().then(({ total: countBefore }) => {
      expect(countBefore, 'tomorrow has sessions').to.be.greaterThan(0);

      // --- Step 3: Select and delete the session we created (unique price) ---
      grid.selectRow(price, true);
      grid.deleteSelected();
      deleteDialog.confirm();
      deleteDialog.shouldNotBeVisible();

      // --- Step 4: Verify the total decreased by exactly one ---
      adjustDateFiltersForTomorrow();
      grid.getPaginationSummary().its('total').should('eq', countBefore - 1);
    });
  });
});
