/// <reference types="cypress" />

/**
 * SES_E2E_03 — Non-admin (Adam) creates his own session and edits an existing one
 *
 * Combined into a single it() block and scoped to run-unique data, so it needs
 * no DB reset and coexists with other rows.
 */

import {
  setupAdminWithTwoSessions,
  loginAsAdam,
  adjustDateFiltersForTomorrow,
  createSessionViaForm,
  getTomorrowFormatted,
  type TwoSessionPrices,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniquePrice } from '../../utils/unique';

describe('Session NON-ADMIN CREATE & EDIT Tests (Adam)', () => {
  let prices: TwoSessionPrices;

  beforeEach(() => {
    prices = setupAdminWithTwoSessions();

    // Switch to Adam
    loginAsAdam();
    new NavigationHelper().navigateToSession();
    adjustDateFiltersForTomorrow();
  });

  it('SES_E2E_03: should allow Adam to create and edit sessions', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const tomorrow = getTomorrowFormatted();
    const { adamPrice } = prices;
    const ownPrice = String(uniquePrice());
    const editedPrice = String(uniquePrice());

    // --- Part A: Adam creates his own session ---

    // Verify New button IS visible
    grid.shouldHaveCreateButton();

    // Create Adam's self-created session: tomorrow 14:00-14:50, Room T7.
    // Therapy is skipped — Adam has no therapy options in the autocomplete.
    // Use "Select Myself" button for therapist — avoids the dropdown entirely
    // and is the natural UX path for a non-admin creating a session for themselves.
    createSessionViaForm({
      useSelfSelectTherapist: true,
      roomText: 'T7',
      startDate: tomorrow,
      startTime: '14:00',
      endDate: tomorrow,
      endTime: '14:50',
      price: ownPrice,
    });

    // Re-navigate to get a fresh grid, then apply date filters
    nav.navigateToSession();
    adjustDateFiltersForTomorrow();
    grid.findRow(ownPrice, true).should('contain.text', 'T7');

    // --- Part B: Adam edits his existing session (identified by unique price) ---

    grid.openRow(adamPrice, true);
    form.waitForFormLoad();

    // Verify fields are pre-populated
    form.shouldHaveDropdownValue('Room', 'B1');
    form.shouldHaveFieldValue('Price', adamPrice);

    // Update Room to T5 and price
    form.selectRoom('T5');
    form.fillPrice(editedPrice);
    form.submit();
    form.waitForFormClose();

    // Re-navigate to verify the edited session is now in T5
    nav.navigateToSession();
    adjustDateFiltersForTomorrow();
    grid.findRow(editedPrice, true).should('contain.text', 'T5');
  });
});
