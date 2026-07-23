/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { generateRandomString } from '../../utils/unique';

export { generateRandomString };

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;
export const ADAM_THERAPIST_OPTION = 'Adam Hałaczkiewicz - CBT Therapist (in training)';
export const MARTA_THERAPIST_OPTION = 'Dr. Marta Kuczek - Cognitive Behavioral Therapist';
export const SERVICE_CBT = 'Cognitive Behavioral Therapy';
export const EXISTING_CUSTOMER = 'Johnson Mike';

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getTodayFormatted(): string {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// ── Login helpers ──────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsNonAdmin(): void {
  cylog('login as non admin');
  cy.login('jannowak', 'Password1!');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

// ── Therapy creation / editing helpers ─────────────────────────────────────────

export interface TherapyCreateOptions {
  displayName: string;
  therapistName: string;
  serviceName?: string;
  customerNames?: string[];
  roomName?: string;
  startDate?: string;
  duration?: string;
  price?: string;
}

export function createTherapyViaForm(options: TherapyCreateOptions): void {
  cylog('create therapy via form');
  const form = new TherapyFormComponent();
  const grid = new GridComponent();

  form.clickNew();

  form.fillBasicInfo({
    displayName: options.displayName,
    therapistName: options.therapistName,
    serviceName: options.serviceName || SERVICE_CBT,
    customerNames: options.customerNames || [EXISTING_CUSTOMER],
  });

  form.fillSchedule({
    startDate: options.startDate || getTodayFormatted(),
    duration: options.duration,
    price: options.price,
  });

  form.goToSessionFrequencyTab();
  form.clickAddSchedule();
  if (options.roomName) {
    form.selectFrequencyRoom(options.roomName);
  } else {
    form.selectFirstFrequencyRoom();
  }

  form.submitCreateAndClose();
  grid.waitForGrid();
  // Filter to this therapy before asserting — the grid accumulates rows without
  // a DB reset and a freshly-created row can paginate off page 1.
  grid.search('filter-displayName', options.displayName);
  grid.waitForFetchSettled();
  grid.shouldContain(options.displayName);
  grid.clearSearch('filter-displayName');
  grid.waitForFetchSettled();
}

export function editTherapyInForm(
  currentDisplayName: string,
  updates: { displayName?: string; price?: string; duration?: string }
): void {
  cylog('edit therapy in form');
  const form = new TherapyFormComponent();
  const grid = new GridComponent();

  grid.search('filter-displayName', currentDisplayName);
  grid.waitForFetchSettled();
  grid.openRow(currentDisplayName);
  form.waitForFormLoad();

  if (updates.displayName) {
    form.fillDisplayName(updates.displayName);
  }

  if (updates.price !== undefined || updates.duration !== undefined) {
    form.goToConfigurationTab();
    if (updates.duration !== undefined) {
      form.fillSessionDuration(updates.duration);
    }
    if (updates.price !== undefined) {
      form.fillSessionPrice(updates.price);
    }
  }

  form.submit();
  grid.waitForGrid();

  if (updates.displayName) {
    grid.search('filter-displayName', updates.displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(updates.displayName);
    grid.clearSearch('filter-displayName');
    grid.waitForFetchSettled();
  }
}

// ── Setup functions ────────────────────────────────────────────────────────────

// WARNING: jannowak gets 403 on dropdown API calls with core v0.0.11.
// Prefer setupTherapyTestForAdam() for non-admin tests.
export function setupTherapyTestForNonAdmin(): void {
  cylog('setup therapy test for non admin');
  loginAsNonAdmin();
  new NavigationHelper().navigateToTherapy();
}

export function setupTherapyTestForAdam(): void {
  cylog('setup therapy test for adam');
  loginAsAdmin();
  cy.visit('/core/therapist-customer');
  cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('exist');
  cy.get('[data-testid="create-item-btn"]').click();

  cy.get('input[data-testid="therapist-id"]', { timeout: 15000 }).should('exist');

  cy.get('input[data-testid="therapist-id"]').click();
  cy.get('body').then(($body) => {
    if ($body.find('.MuiAutocomplete-loading').length > 0) {
      cy.get('.MuiAutocomplete-loading', { timeout: 30000 }).should('not.exist');
    }
  });
  cy.get('[role="option"]', { timeout: 30000 }).contains('Adam').click();

  cy.get('input[data-testid="customer-id"]').click();
  cy.get('body').then(($body) => {
    if ($body.find('.MuiAutocomplete-loading').length > 0) {
      cy.get('.MuiAutocomplete-loading', { timeout: 30000 }).should('not.exist');
    }
  });
  cy.get('[role="option"]', { timeout: 30000 }).contains(EXISTING_CUSTOMER).click();

  cy.get('button[type="submit"]').click();

  cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 })
    .find('tbody')
    .contains(EXISTING_CUSTOMER, { timeout: 30000 });

  setupFor('adam', (nav) => nav.navigateToTherapy());
}

export function setupAdminWithTwoTherapies(): void {
  cylog('setup admin with two therapies');
  setupFor('admin', (nav) => nav.navigateToTherapy());

  createTherapyViaForm({
    displayName: 'Adam Therapy CBT',
    therapistName: ADAM_THERAPIST_OPTION,
    roomName: 'B1',
    duration: '60',
    price: '200',
  });

  createTherapyViaForm({
    displayName: 'Marta Therapy CBT',
    therapistName: MARTA_THERAPIST_OPTION,
    roomName: 'B2',
    duration: '50',
    price: '180',
  });
}

export function setupThreeTherapiesWithAdamEdits(): void {
  cylog('setup three therapies with adam edits');
  setupAdminWithTwoTherapies();

  setupFor('adam', (nav) => nav.navigateToTherapy());

  createTherapyViaForm({
    displayName: 'Adam Self-Created Therapy',
    therapistName: ADAM_THERAPIST_OPTION,
    duration: '45',
    price: '150',
  });

  editTherapyInForm('Adam Therapy CBT', {
    displayName: 'Adam Therapy CBT Updated',
    price: '220',
  });

  setupFor('admin', (nav) => nav.navigateToTherapy());
}

function createNewCustomer(randomCustomerName: string, randomCustomerEmail: string): void {
  new NavigationHelper().navigateToCustomer();

  cy.get('button').contains('New').click();
  cy.get('input[name="firstName"]').type(randomCustomerName);
  cy.get('input[name="lastName"]').type(randomCustomerName);
  cy.get('input[name="email"]').type(randomCustomerEmail);
  cy.get('button[type="submit"]').click();
  cy.get('input[name="firstName"]', { timeout: 10000 }).should('not.exist');
  new GridComponent().search('filter-firstName', randomCustomerName);
  new GridComponent().waitForGrid();
  cy.contains('td', randomCustomerName, { timeout: 15000 }).should('be.visible');
}

export function setupTherapyTestForAdmin(
  randomCustomerName: string,
  randomCustomerEmail: string
): void {
  cylog('setup therapy test for admin');
  loginAsAdmin();
  createNewCustomer(randomCustomerName, randomCustomerEmail);
  new NavigationHelper().navigateToTherapy();
}
