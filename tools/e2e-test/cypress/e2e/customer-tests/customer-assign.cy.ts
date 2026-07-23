/// <reference types="cypress" />

/**
 * CUS_E2E_02 — Admin assigns both customers to Therapist (Adam)
 */

import {
  setupCustomerTestForAdmin,
  createAliceAndBob,
  makeAlice,
  makeBob,
  ADAM_FULL_NAME,
} from './customer-test-utils';
import { TherapistCustomerFormComponent } from '../components-objects/therapist-customer-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniqueEmail, uniqueToken } from '../../utils/unique';
import { CustomerFormComponent } from '../components-objects/customer-form.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';

describe('Customer ASSIGN Tests (Admin)', () => {
  it('CUS_E2E_02: should assign Alice and Bob to Adam and verify links in Therapist Customer grid', { tags: '@mutating' }, () => {
    setupCustomerTestForAdmin();
    const alice = makeAlice();
    const bob = makeBob();
    // Pre-create Alice and Bob so the assignment can reference them
    createAliceAndBob(alice, bob);

    const form = new TherapistCustomerFormComponent();
    const formCustomer = new CustomerFormComponent();
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const deleteDialog = new DeleteDialog();

    // Navigate to Therapist Management → Therapist Customer
    nav.navigateToTherapistCustomer();
    grid.waitForGrid();

    // Assign Alice Smith to Adam (label is `LastName FirstName` after UTR-000177)
    form.clickNew();
    form.selectTherapist(ADAM_FULL_NAME);
    form.selectCustomer(`${alice.lastName} ${alice.firstName}`);
    form.submit();

    grid.waitForGrid();
    grid.shouldContain(ADAM_FULL_NAME);
    grid.shouldContain(alice.lastName);

    // Assign Bob Jones to Adam (label is `LastName FirstName` after UTR-000177)
    form.clickNew();
    form.selectTherapist(ADAM_FULL_NAME);
    form.selectCustomer(`${bob.lastName} ${bob.firstName}`);
    form.submit();

    grid.waitForGrid();
    grid.shouldContain(bob.lastName);

    // Verify grid shows 2 link rows for Adam
    grid.getRowCount().should('be.gte', 2);

    grid.selectRows([bob.firstName, alice.firstName]);
    grid.deleteSelected();
    deleteDialog.confirm();

    nav.navigateToCustomer();
    nav.verifyBreadcrumb('Customer');

    const bobUpdatedLastName: string = `Jones Updated ${uniqueToken()}`;
    const bobUpdatedEmail: string = uniqueEmail('bob.updated');

    // Filter to Bob before opening — the unfiltered grid accumulates rows.
    grid.search('filter-firstName', bob.firstName);
    grid.waitForFetchSettled();
    grid.openRow(bob.firstName, true);
    formCustomer.waitForFormLoad();
    formCustomer.fillCustomerDetails({
      lastName: bobUpdatedLastName,
      email: bobUpdatedEmail,
    });
    formCustomer.submit();

    grid.waitForGrid();
    grid.shouldContainExact(bobUpdatedLastName);
    grid.shouldContainExact(bobUpdatedEmail);
    grid.shouldNotContainExact(bob.email);

    grid.waitForFetchSettled();
    grid.selectRow(bob.firstName);
    grid.getRowDataId(bob.firstName).then((bobId) => {
      grid.deleteSelected();
      deleteDialog.confirm();

      grid.waitForGrid();
      grid.waitForFetchSettled();
      grid.shouldNotHaveRowWithId(bobId);
    });
  });
});
