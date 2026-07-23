/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { CustomerFormComponent } from '../components-objects/customer-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistCustomerFormComponent } from '../components-objects/therapist-customer-form.component';
import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { uniqueEmail, uniqueToken } from '../../utils/unique';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  // TODO: add phoneNumber and address once UI exposes data-testid for those fields
}

/**
 * Build a customer whose firstName and email are unique to this test run, so
 * assertions can scope to it against the shared, accumulating DB. Call inside
 * `beforeEach`/`it`, never at module scope.
 */
export function makeCustomer(firstNameBase: string, lastNameBase: string): CustomerData {
  const token = uniqueToken();
  return {
    firstName: `${firstNameBase} ${token}`,
    lastName: lastNameBase+token,
    email: uniqueEmail(firstNameBase.toLowerCase().replace(/\s+/g, '')),
  };
}

export const makeAlice = (): CustomerData => makeCustomer('Alice', 'Smith');
export const makeBob = (): CustomerData => makeCustomer('Bob', 'Jones');

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

/** Reset DB, login as admin, navigate to Customer page */
export function setupCustomerTestForAdmin(): void {
  cylog('setup customer test for admin');
  setupFor('admin', (nav) => nav.navigateToCustomer());
}

/** Reset DB, login as Adam, navigate to Customer page */
export function setupCustomerTestForAdam(): void {
  cylog('setup customer test for adam');
  setupFor('adam', (nav) => nav.navigateToCustomer());
}

/**
 * Create a single customer via the Customer page form.
 * Assumes the Customer grid page is already open.
 */
export function createCustomer(data: CustomerData): void {
  cylog('create customer');
  const form = new CustomerFormComponent();
  const grid = new GridComponent();

  form.clickNew();
  form.fillCustomerDetails(data, false);
  form.submit();
  grid.waitForGrid();
  // Filter to this run's customer before asserting: with no DB reset the grid
  // accumulates rows and a freshly-created customer can paginate off page 1.
  grid.search('filter-firstName', data.firstName);
  grid.waitForFetchSettled();
  grid.shouldContain(data.firstName);
  grid.clearSearch('filter-firstName');
  grid.waitForFetchSettled();
}

/** Create two customers. Assumes Customer page is open. */
export function createAliceAndBob(alice: CustomerData, bob: CustomerData): void {
  cylog('create alice and bob');
  createCustomer(alice);
  createCustomer(bob);
}

/**
 * Assign a customer to a therapist via the Therapist Customer page.
 * Assumes the user is logged in as admin.
 */
export function assignCustomerToTherapist(therapistName: string, customerName: string): void {
  cylog('assign customer to therapist');
  const nav = new NavigationHelper();
  const form = new TherapistCustomerFormComponent();
  const grid = new GridComponent();

  nav.navigateToTherapistCustomer();
  form.clickNew();
  form.selectTherapist(therapistName);
  form.selectCustomer(customerName);
  form.submit();
  // Wait for the form dialog to close before checking the grid
  cy.contains('h2', 'Create Therapist Customer Link', { timeout: 10000 }).should('not.exist');
  grid.waitForGrid();
  grid.shouldContain(therapistName);
  grid.shouldContain(customerName);
}
