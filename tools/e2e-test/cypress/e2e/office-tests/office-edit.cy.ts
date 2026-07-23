/// <reference types="cypress" />

import { OfficeFormComponent } from '../components-objects/office-form.component';
import { GridComponent } from '../components-objects/grid.component';
import {
  generateRandomString,
  setupOfficeTestForAdmin,
} from './office-test-utils';

/**
 * Regression guard for UTR-000193 — editing an office must continue to work
 * after the Rooms tab (UTR-000003) was added. We create an office, then
 * reopen it, change every editable field, save, and verify all three fields
 * round-trip.
 */
describe('Office EDIT (Admin)', () => {
  beforeEach(() => {
    setupOfficeTestForAdmin();
  });

  it('OFF_E2E_02: should round-trip every field on edit', { tags: '@mutating' }, () => {
    const suffix = generateRandomString(6);
    const initial = {
      nameEn: `Office EN ${suffix}`,
      namePl: `Biuro PL ${suffix}`,
      address: `Original Address ${suffix}`,
    };
    const edited = {
      nameEn: `Office EN ${suffix} EDITED`,
      namePl: `Biuro PL ${suffix} EDITED`,
      address: `Edited Address ${suffix}`,
    };

    const form = new OfficeFormComponent();
    const grid = new GridComponent();

    form.clickNew();
    form.waitForFormLoad();
    form.fill(initial, false);
    form.submit();

    grid.waitForGrid();
    // Filter to this run's office before asserting/opening — the grid
    // accumulates rows without a DB reset.
    grid.search('filter-displayName', initial.nameEn);
    grid.waitForFetchSettled();
    grid.shouldContain(initial.nameEn);

    grid.openRow(initial.nameEn);
    form.waitForFormLoad();
    form.shouldHaveEnglishName(initial.nameEn);
    form.shouldHavePolishName(initial.namePl);
    form.shouldHaveAddress(initial.address);

    form.fill(edited, true);
    form.submit();

    grid.waitForGrid();
    grid.search('filter-displayName', edited.nameEn);
    grid.waitForFetchSettled();
    grid.shouldContain(edited.nameEn);

    grid.openRow(edited.nameEn);
    form.waitForFormLoad();
    form.shouldHaveEnglishName(edited.nameEn);
    form.shouldHavePolishName(edited.namePl);
    form.shouldHaveAddress(edited.address);
    form.cancel();
  });
});
