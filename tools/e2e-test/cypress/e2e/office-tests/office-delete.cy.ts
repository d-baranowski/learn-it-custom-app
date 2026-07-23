/// <reference types="cypress" />

import { OfficeFormComponent } from '../components-objects/office-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import {
  generateRandomString,
  setupOfficeTestForAdmin,
} from './office-test-utils';

describe('Office DELETE (Admin)', () => {
  beforeEach(() => {
    setupOfficeTestForAdmin();
  });

  it('OFF_E2E_03: should delete a newly created office', { tags: '@mutating' }, () => {
    const suffix = generateRandomString(6);
    const data = {
      nameEn: `Office DEL ${suffix}`,
      namePl: `Biuro DEL ${suffix}`,
      address: `Delete Test ${suffix}`,
    };

    const form = new OfficeFormComponent();
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();

    form.clickNew();
    form.waitForFormLoad();
    form.fill(data, false);
    form.submit();

    grid.waitForGrid();
    // Filter to this run's office before asserting/selecting — the grid
    // accumulates rows without a DB reset.
    grid.search('filter-displayName', data.nameEn);
    grid.waitForFetchSettled();
    grid.shouldContain(data.nameEn);

    grid.getRowDataId(data.nameEn).then((officeId) => {
      grid.selectRow(data.nameEn);
      grid.deleteSelected();
      deleteDialog.confirm();

      grid.waitForGrid();
      grid.waitForFetchSettled();
      grid.shouldNotHaveRowWithId(officeId);
    });
  });
});
