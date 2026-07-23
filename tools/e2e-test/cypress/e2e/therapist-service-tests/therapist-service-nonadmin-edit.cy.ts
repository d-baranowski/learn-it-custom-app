/// <reference types="cypress" />

/**
 * TEST: TS_E2E_05 — Non-admin (Adam) edits own service
 *
 * Steps:
 * 1. Reset DB, login as Adam (non-admin therapist)
 * 2. Navigate to Therapist Service page
 * 3. Double-click Adam's service row to open edit form
 * 4. Verify Therapist, Service, and Price are pre-populated
 * 5. Update Price to a new value
 * 6. Click Save
 * 7. Verify the grid shows the updated price
 */

import {
  setupAsAdam,
  ADAM_DISPLAY_NAME,
  navigateToTherapistServicePage,
} from './therapist-service-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistServiceFormComponent } from '../components-objects/therapist-service-form.component';
import { uniquePrice } from '../../utils/unique';

describe('Therapist Service - Non-admin edit own service', () => {
  beforeEach(() => {
    setupAsAdam();
  });

  it('TS_E2E_05: non-admin should be able to edit own therapist service price', { tags: '@mutating' }, () => {
    const form = new TherapistServiceFormComponent();
    const grid = new GridComponent();
    // Per-run unique price so the post-edit assertion targets this run's change
    // against Adam's accumulating links on the non-reset DB.
    const updatedPrice = String(uniquePrice());

    // --- Double-click one of Adam's own service rows to open the edit form ---
    grid.openRow(ADAM_DISPLAY_NAME);
    form.waitForFormLoad();

    // --- Verify form fields are pre-populated ---
    form.shouldHaveTherapistPopulated();
    form.shouldHaveServicePopulated();
    form.shouldHavePricePopulated();

    // --- Update price and save ---
    form.fillPrice(updatedPrice);
    form.clickSave();
    form.waitForFormClose();

    // --- Verify the updated price appears in Adam's grid ---
    navigateToTherapistServicePage();
    grid.findRow(updatedPrice).should('contain.text', ADAM_DISPLAY_NAME);
  });
});
