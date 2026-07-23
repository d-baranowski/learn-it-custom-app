/// <reference types="cypress" />

/**
 * TEST: TS_E2E_01 — Admin creates a valid therapist service link
 *
 * Steps:
 * 1. Login as admin, navigate to therapist service page, self-heal the target
 *    (therapist, service) link so the create can't 409 on the non-reset DB.
 * 2. Click New to open create form.
 * 3. Select a therapist, service, and enter a per-run unique price.
 * 4. Click Save.
 * 5. Verify the new entry appears in the grid (filtered) with correct data.
 */

import {
  makeValidTherapistService,
  setupAsAdmin,
  navigateToTherapistServicePage,
  filterTherapistService,
  deleteTherapistServiceLinkIfExists,
  type TherapistServiceData,
} from './therapist-service-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistServiceFormComponent } from '../components-objects/therapist-service-form.component';

describe('Therapist Service - Create valid as admin', () => {
  let tsl: TherapistServiceData;

  beforeEach(() => {
    tsl = makeValidTherapistService();
    setupAsAdmin();
    // Remove any pre-existing (Adam, CBT) link so the create below can't
    // violate the (therapist, service) uniqueness constraint.
    deleteTherapistServiceLinkIfExists(tsl.therapistName, tsl.serviceName);
    navigateToTherapistServicePage();
  });

  it('TS_E2E_01: should create a valid therapist service link', { tags: '@mutating' }, () => {
    const form = new TherapistServiceFormComponent();
    const grid = new GridComponent();

    // --- Open create form ---
    form.clickAddItem();
    form.waitForFormLoad();

    // --- Fill form fields ---
    form.selectTherapist(tsl.therapistName);
    form.selectService(tsl.serviceName);
    form.fillPrice(tsl.price);

    // --- Save; a successful create closes the form ---
    form.clickSave();
    form.waitForFormClose();

    // --- Verify: filter to this link and confirm the row with the unique price ---
    filterTherapistService(tsl.therapistName, tsl.serviceName);
    grid.findRow(tsl.price).should('contain.text', tsl.serviceName);
  });
});
