/// <reference types="cypress" />

/**
 * TEST: TS_E2E_02 — Admin edits a therapist service price
 *
 * The test owns its target: it creates a disposable (therapist, service) link
 * with a per-run unique price, then edits that exact row to another unique
 * price. Editing a seeded row by a fixed price would not be re-runnable against
 * the non-reset DB (the price changes after the first run).
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
import { uniquePrice } from '../../utils/unique';

describe('Therapist Service - Edit price as admin', () => {
  let tsl: TherapistServiceData;

  beforeEach(() => {
    tsl = makeValidTherapistService();
    setupAsAdmin();
    deleteTherapistServiceLinkIfExists(tsl.therapistName, tsl.serviceName);
    navigateToTherapistServicePage();
  });

  it('TS_E2E_02: should edit an existing therapist service price', { tags: '@mutating' }, () => {
    const form = new TherapistServiceFormComponent();
    const grid = new GridComponent();
    const updatedPrice = String(uniquePrice());

    // --- Create a disposable link to edit ---
    form.clickAddItem();
    form.waitForFormLoad();
    form.selectTherapist(tsl.therapistName);
    form.selectService(tsl.serviceName);
    form.fillPrice(tsl.price);
    form.clickSave();
    form.waitForFormClose();

    // --- Open the link (by its unique price) and verify it is pre-populated ---
    filterTherapistService(tsl.therapistName, tsl.serviceName);
    grid.openRow(tsl.price);
    form.waitForFormLoad();
    form.shouldHaveTherapistPopulated();
    form.shouldHaveServicePopulated();
    form.shouldHavePrice(tsl.price);

    // --- Update price ---
    form.fillPrice(updatedPrice);
    form.clickSave();
    form.waitForFormClose();

    // --- Verify the updated price appears on the link's row ---
    filterTherapistService(tsl.therapistName, tsl.serviceName);
    grid.findRow(updatedPrice).should('contain.text', tsl.serviceName);
  });
});
