/// <reference types="cypress" />

/**
 * SES_E2E_04 — Admin updates and deletes all created sessions
 *
 * Combined into a single it() block and scoped to run-unique prices/row ids, so
 * it needs no DB reset and coexists with other data in the grid.
 */

import {
  setupThreeSessionsWithAdamEdits,
  adjustDateFiltersForTomorrow,
  type ThreeSessionPrices,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import { uniquePrice } from '../../utils/unique';

describe('Session UPDATE & DELETE Tests (Admin)', () => {
  let prices: ThreeSessionPrices;

  beforeEach(() => {
    prices = setupThreeSessionsWithAdamEdits();
  });

  it('SES_E2E_04: should update and delete all sessions', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const deleteDialog = new DeleteDialog();
    const { adamEditedPrice, adamOwnPrice, martaPrice } = prices;
    const martaUpdatedPrice = String(uniquePrice());

    // --- Verify test sessions are visible ---
    grid.shouldContainExact(adamEditedPrice);
    grid.shouldContainExact(adamOwnPrice);
    grid.shouldContainExact(martaPrice);

    // --- Update Marta's session (price -> martaUpdatedPrice, Room B2 -> B3) ---
    grid.openRow(martaPrice, true);
    form.waitForFormLoad();

    form.shouldHaveDropdownValue('Therapist', 'Marta Kuczek');
    form.shouldHaveFieldValue('Price', martaPrice);

    form.selectRoom('B3');
    form.fillPrice(martaUpdatedPrice);
    form.submit();
    form.waitForFormClose();

    // Navigate fresh to get a clean grid
    nav.navigateToSession();
    adjustDateFiltersForTomorrow();
    grid.shouldContainExact(martaUpdatedPrice);

    // Clear any lingering row selection from the edit operation
    grid.clearSelection();

    // --- Delete Adam's own T7 session ---
    // shouldNotHaveRowWithId retries until the deleted row leaves the grid,
    // so it absorbs the async delete + refetch without gating on a toast.
    grid.getRowDataId(adamOwnPrice, true).then((idOwn) => {
      grid.selectRow(adamOwnPrice, true);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.shouldNotHaveRowWithId(idOwn);
      grid.shouldContainExact(adamEditedPrice);
      grid.shouldContainExact(martaUpdatedPrice);
    });

    // --- Delete Adam's edited T5 session ---
    grid.getRowDataId(adamEditedPrice, true).then((idEdited) => {
      grid.selectRow(adamEditedPrice, true);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.shouldNotHaveRowWithId(idEdited);
      grid.shouldContainExact(martaUpdatedPrice);
    });

    // --- Delete Marta's edited B3 session ---
    grid.getRowDataId(martaUpdatedPrice, true).then((idMarta) => {
      grid.selectRow(martaUpdatedPrice, true);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.shouldNotHaveRowWithId(idMarta);
    });
  });
});
