/// <reference types="cypress" />
import {
  generateRandomString,
  setupTherapyTestForAdam,
  ADAM_FULL_NAME,
  EXISTING_CUSTOMER,
} from './therapy-test-utils';
import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';

describe('Therapy CREATE Tests (Non-Admin)', () => {
  beforeEach(() => {
    setupTherapyTestForAdam();
  });

  it('THPY_E2E_08: should create a therapy with existing customer (CREATE)', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Adam Therapy ${randomValue}`;
    const serviceName = 'Cognitive Behavioral Therapy';
    const roomName = 'B1';

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    // Create a therapy with the existing customer
    form.clickNew();

    // Fill in the therapy display name
    form.fillDisplayName(displayName, false);

    // Verify therapist dropdown only shows Adam
    form.getTherapistOptionCount().then((count) => {
      expect(count).to.equal(1);
    });
    form.selectTherapist(ADAM_FULL_NAME);

    // Fill in the service
    form.selectService(serviceName);

    // Select the existing customer (Mike Johnson)
    form.selectCustomers([EXISTING_CUSTOMER]);

    // Go to Schedule & Pricing tab
    form.goToConfigurationTab();

    // Verify default values
    form.getSessionDuration().should('eq', '50');
    form.getSessionPrice().should('eq', '200');

    // Go to Session Frequency tab
    form.goToSessionFrequencyTab();

    // Click Add Schedule
    form.clickAddSchedule();
    form.selectFrequencyRoom(roomName);

    // Verify the session frequency defaults
    form
      .getFrequencyEvery()
      .should('eq', '1');
    form
      .getFrequencyUnit()
      .should('eq', 'Week');
    form.getFrequencyStartTime().should('eq', '09:00');

    // Submit the form
    form.submitCreateAndClose();

    // Filter to this therapy before asserting — the grid accumulates rows
    // without a DB reset and a freshly-created row can paginate off page 1.
    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName);

    // Verify the therapy is assigned to Adam
    grid.findRow(displayName).should('contain.text', ADAM_FULL_NAME);
  });

  // THPY_E2E_09 (Select Myself populates therapist) migrated to jest —
  // therapy_form.test.tsx 'Select Myself therapist' describe covers it.

  it('THPY_E2E_10: should see only Mike Johnson in customer dropdown', { tags: '@mutating' }, () => {
    const form = new TherapyFormComponent();

    // Click the New button
    form.clickNew();

    // Fill required fields to enable customer dropdown
    form.fillDisplayName('Test Therapy', false);
    form.selectFirstTherapist();
    form.selectFirstService();

    // Open customer dropdown
    cy.get('input[data-testid="customer-ids"]').click();

    // Verify Mike Johnson is visible in the customer dropdown
    form.hasCustomerOption(EXISTING_CUSTOMER).should('be.true');

    // Close the form
    form.cancel();
  });
});
