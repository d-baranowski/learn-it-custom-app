/// <reference types="cypress" />

/**
 * SES_E2E_07 — Admin selects multiple sessions and deletes them in bulk
 *
 * Steps:
 * 1. Reset DB, admin creates 2 sessions with unique prices, adjust date filters.
 * 2. Select both session rows via checkboxes.
 * 3. Use Actions > Delete to bulk-delete them.
 * 4. Confirm the delete dialog.
 * 5. Verify both sessions are removed from the grid.
 */

import {
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPY_OPTION,
  ADAM_THERAPIST_OPTION,
  MARTA_THERAPY_OPTION,
  MARTA_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniquePrice } from '../../utils/unique';

describe('Session BULK DELETE Tests (Admin)', () => {
  const nav = new NavigationHelper();

  beforeEach(() => {
    cy.login();
    nav.navigateToSession();
  });

  it('SES_E2E_07: should select multiple sessions and delete them in bulk', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();
    const tomorrow = getTomorrowFormatted();
    // Per-run unique prices identify this run's sessions unambiguously among
    // tomorrow's accumulating sessions on the non-reset DB.
    const price1 = String(uniquePrice());
    const price2 = String(uniquePrice());

    createSessionViaForm({
      therapyText: ADAM_THERAPY_OPTION,
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price: price1,
    });

    createSessionViaForm({
      therapyText: MARTA_THERAPY_OPTION,
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B2',
      startDate: tomorrow,
      startTime: '11:00',
      endDate: tomorrow,
      endTime: '11:50',
      price: price2,
    });

    adjustDateFiltersForTomorrow();

    // Verify both sessions are present
    grid.shouldContainExact(price1);
    grid.shouldContainExact(price2);

    // Select both rows by their unique prices
    grid.selectRows([price1, price2], true);

    // Bulk delete
    grid.deleteSelected();
    deleteDialog.confirm();
    deleteDialog.shouldNotBeVisible();

    // Navigate fresh and verify both are gone
    nav.navigateToSession();
    adjustDateFiltersForTomorrow();
    grid.shouldNotContainExact(price1);
    grid.shouldNotContainExact(price2);
  });
});
