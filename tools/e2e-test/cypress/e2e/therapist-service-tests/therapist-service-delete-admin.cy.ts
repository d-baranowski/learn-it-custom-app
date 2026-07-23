/// <reference types="cypress" />

/**
 * TEST: TS_E2E_03 — Admin deletes a therapist service
 *
 * The test owns its target: it creates a disposable (therapist, service) link
 * with a per-run unique price, then deletes that exact row by id. Deleting a
 * seeded link would not be re-runnable against the non-reset DB (the seeded row
 * is gone after the first run).
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
import { DeleteDialog } from '../components-objects/delete-dialog.component';

describe('Therapist Service - Delete as admin', () => {
  let tsl: TherapistServiceData;

  beforeEach(() => {
    tsl = makeValidTherapistService();
    setupAsAdmin();
    deleteTherapistServiceLinkIfExists(tsl.therapistName, tsl.serviceName);
    navigateToTherapistServicePage();
  });

  it('TS_E2E_03: should delete an existing therapist service', { tags: '@mutating' }, () => {
    const form = new TherapistServiceFormComponent();
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();

    // --- Create a disposable link to delete ---
    form.clickAddItem();
    form.waitForFormLoad();
    form.selectTherapist(tsl.therapistName);
    form.selectService(tsl.serviceName);
    form.fillPrice(tsl.price);
    form.clickSave();
    form.waitForFormClose();

    // --- Filter to it, capture its id, delete, and assert that exact row is gone ---
    filterTherapistService(tsl.therapistName, tsl.serviceName);
    grid.getRowDataId(tsl.price).then((linkId) => {
      grid.selectRow(tsl.price);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.waitForFetchSettled();
      grid.shouldNotHaveRowWithId(linkId);
    });
  });
});
