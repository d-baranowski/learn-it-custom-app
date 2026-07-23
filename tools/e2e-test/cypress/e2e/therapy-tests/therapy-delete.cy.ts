/// <reference types="cypress" />
import {
  generateRandomString,
  setupTherapyTestForAdmin,
} from './therapy-test-utils';
import { uniqueEmail, uniqueToken } from '../../utils/unique';
import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';

describe('Therapy DELETE Tests (Admin)', () => {
  let randomCustomerName: string;
  beforeEach(() => {
    randomCustomerName = 'Test Customer ' + generateRandomString(6);
    setupTherapyTestForAdmin(randomCustomerName, uniqueEmail('newcustomer'));
  });

  it('THPY_DEL_E2E_02: should delete multiple therapies (DELETE)', { tags: '@mutating' }, () => {
    // Both therapies share a run-unique token so the grid can be filtered to
    // exactly this run's two rows (and nothing accumulated from other runs),
    // allowing both to be selected together for a multi-delete.
    const runToken = uniqueToken();
    const displayName1 = `Test Therapy ${runToken} A`;
    const displayName2 = `Test Therapy ${runToken} B`;
    const therapistName = 'Jan Nowak';
    const serviceName = 'Systemic Therapy';
    const roomName = 'B1';

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();
    const deleteDialog = new DeleteDialog();

    // Create first therapy
    form.clickNew();

    form.fillBasicInfo({
      displayName: displayName1,
      therapistName,
      serviceName,
      customerNames: [randomCustomerName],
    });

    form.fillSchedule({
      duration: '50',
      price: '200',
    });

    form.goToSessionFrequencyTab();
    form.clickAddSchedule();
    form.selectFrequencyRoom(roomName);

    form.submitCreateAndClose();
    grid.search('filter-displayName', displayName1);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName1);
    grid.clearSearch('filter-displayName');
    grid.waitForFetchSettled();

    // Create second therapy
    form.clickNew();

    form.fillBasicInfo({
      displayName: displayName2,
      therapistName,
      serviceName,
      customerNames: [randomCustomerName],
    });

    form.fillSchedule({
      duration: '50',
      price: '200',
    });

    form.goToSessionFrequencyTab();
    form.clickAddSchedule();
    form.selectFrequencyRoom(roomName);

    form.submitCreateAndClose();

    // Filter to this run's two therapies so both are visible for selection.
    grid.search('filter-displayName', runToken);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName1);
    grid.shouldContain(displayName2);

    // Select both therapies for deletion
    grid.selectRows([displayName1, displayName2]);

    // Click the Actions button and then Delete menu item
    grid.deleteSelected();


    // Click Cancel in the dialog
    deleteDialog.cancel();

    // Verify the therapy still exists in the (still-filtered) grid
    grid.shouldContain(displayName1);
    grid.shouldContain(displayName2);

    // Click the Actions button and then Delete menu item
    grid.deleteSelected();

    // Confirm deletion in the dialog
    deleteDialog.confirm();

    // Verify both therapies are removed from the (still-filtered) grid
    grid.waitForFetchSettled();
    grid.shouldNotContain(displayName1);
    grid.shouldNotContain(displayName2);
  });
});
