/// <reference types="cypress" />

/**
 * TEST: TS_E2E_04 — Non-admin (Adam) sees only own services and can create new
 *
 * Adam's grid shows only his own links, so a service name identifies its row.
 * The target link is self-healed first so the create can't 409 on the
 * non-reset DB, and the new link carries a per-run unique price.
 */

import {
  setupAsAdam,
  ADAM_DISPLAY_NAME,
  navigateToTherapistServicePage,
  deleteOwnServiceLinkIfExists,
} from './therapist-service-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistServiceFormComponent } from '../components-objects/therapist-service-form.component';
import { uniquePrice } from '../../utils/unique';

const NEW_SERVICE = 'Psychodynamic Therapy';

describe('Therapist Service - Non-admin create', () => {
  beforeEach(() => {
    setupAsAdam();
    deleteOwnServiceLinkIfExists(NEW_SERVICE);
    navigateToTherapistServicePage();
  });

  it('TS_E2E_04: non-admin should see only own services and can create new', { tags: '@mutating' }, () => {
    const form = new TherapistServiceFormComponent();
    const grid = new GridComponent();
    const price = String(uniquePrice());

    // --- Verify grid shows only Adam's services ---
    grid.shouldContain(ADAM_DISPLAY_NAME);

    // --- Verify New button IS visible ---
    form.shouldHaveNewButton();

    // --- Open create form ---
    form.clickAddItem();
    form.waitForFormLoad();

    // --- Fill form: select therapist (self), service, and unique price ---
    form.selectTherapist(ADAM_DISPLAY_NAME);
    form.selectService(NEW_SERVICE);
    form.fillPrice(price);
    form.clickSave();
    form.waitForFormClose();

    // --- Verify the new link (unique price) appears in Adam's grid ---
    grid.findRow(price).should('contain.text', NEW_SERVICE);
    grid.shouldContain(ADAM_DISPLAY_NAME);
  });
});
