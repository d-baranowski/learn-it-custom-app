/// <reference types="cypress" />

import { OfficeFormComponent } from '../components-objects/office-form.component';
import { GridComponent } from '../components-objects/grid.component';
import {
  generateRandomString,
  setupOfficeTestForAdmin,
} from './office-test-utils';

describe('Office CREATE (Admin)', () => {
  beforeEach(() => {
    setupOfficeTestForAdmin();
  });

  it('OFF_E2E_01: should create a new office and show it in the grid', { tags: '@mutating' }, () => {
    const suffix = generateRandomString(6);
    const data = {
      nameEn: `Office EN ${suffix}`,
      namePl: `Biuro PL ${suffix}`,
      address: `123 Test Street ${suffix}`,
    };

    const form = new OfficeFormComponent();
    const grid = new GridComponent();

    form.clickNew();
    form.waitForFormLoad();
    form.fill(data, false);
    form.submit();

    grid.waitForGrid();
    // Filter to this run's office before asserting — the grid accumulates rows
    // without a DB reset and a new office can paginate off page 1.
    grid.search('filter-displayName', data.nameEn);
    grid.waitForFetchSettled();
    grid.shouldContain(data.nameEn);
  });
});
