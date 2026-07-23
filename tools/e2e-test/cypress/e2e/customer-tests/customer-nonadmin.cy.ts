/// <reference types="cypress" />

/**
 * CUS_E2E_03 — Non-admin (Adam) creates a customer and is auto-assigned
 */

import {
  loginAsAdam,
} from './customer-test-utils';
import { CustomerFormComponent } from '../components-objects/customer-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { uniqueEmail } from '../../utils/unique';

describe('Customer NON-ADMIN Tests (Adam)', () => {
  beforeEach(() => {
    loginAsAdam();
    new NavigationHelper().navigateToCustomer();
  });

  it('CUS_E2E_03: should auto-assign Adam to customer he creates', { tags: '@mutating' }, () => {
    const form = new CustomerFormComponent();
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const uniqueId = Date.now();
    const firstName = `Auto${uniqueId}`;
    const lastName = 'Assigned';
    const email = uniqueEmail('auto.assigned');

    // Verify breadcrumb
    nav.verifyBreadcrumb('Customer');
    grid.waitForGrid();

    // Adam can create customer
    form.clickNew();
    form.fillCustomerDetails({ firstName, lastName, email }, false);
    form.submit();
    grid.waitForGrid();
    grid.shouldContain(firstName);

    // Verify auto-created therapist_customer link by reloading Adam's own-scope view.
    // If auto-link wasn't created, the customer would not be visible after a fresh login.
    loginAsAdam();
    nav.navigateToCustomer();
    grid.waitForGrid();
    grid.shouldContain(firstName);
    grid.shouldContain(lastName);
  });
});
