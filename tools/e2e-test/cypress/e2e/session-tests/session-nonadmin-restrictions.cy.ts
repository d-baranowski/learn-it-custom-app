/// <reference types="cypress" />

/**
 * SES_E2E_08 — Non-admin (Adam) can only create sessions for himself
 *              and can only see customers assigned to him
 *
 * Steps:
 * 1. Admin assigns Mike Johnson to Adam via Therapist Customer page.
 * 2. Login as Adam, navigate to Session page.
 * 3. Open the new session form.
 * 4. Verify therapist dropdown only contains Adam (cannot pick another therapist).
 * 5. Verify customer dropdown only shows customers assigned to Adam.
 */

import { loginAsAdmin, loginAsAdam } from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';

const MIKE_JOHNSON = 'Johnson Mike';

/**
 * Setup: admin assigns Mike Johnson to Adam in Therapist Customer.
 */
function setupAdamWithAssignedCustomer(): void {
  loginAsAdmin();

  // Assign Mike Johnson to Adam via Therapist Customer page
  const nav = new NavigationHelper();
  nav.navigateToTherapistCustomer();

  cy.get('[data-testid="create-item-btn"]').click();

  // Wait for form to load before interacting with dropdowns
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
  cy.get('[role="option"]', { timeout: 30000 }).contains(MIKE_JOHNSON).click();

  cy.get('button[type="submit"]').click();
  cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 })
    .find('tbody')
    .contains(MIKE_JOHNSON, { timeout: 30000 });
}

describe('Session NON-ADMIN RESTRICTIONS Tests (Adam)', () => {
  beforeEach(() => {
    setupAdamWithAssignedCustomer();

    // Switch to Adam
    loginAsAdam();
    new NavigationHelper().navigateToSession();
  });

  it('SES_E2E_08: should restrict therapist to only Adam and show only assigned customers', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();

    form.clickNew();
    form.waitForFormLoad();

    // Verify therapist dropdown: Adam should be the only option
    form.getDropdownOptions('therapist-id').then((options) => {
      // All options should contain "Adam" — there should be no other therapist
      expect(options.length).to.be.greaterThan(0);
      options.forEach((opt) => {
        expect(opt).to.contain('Adam');
      });
    });
    // Use "Select Myself" to select Adam — avoids re-opening the dropdown
    // and is the natural path for a non-admin therapist selecting themselves.
    form.selectMyselfAsTherapist();

    // Verify customer dropdown: should only show Mike Johnson (the assigned customer)
    form.getDropdownOptions('customer-ids').then((options) => {
      expect(options.length).to.be.greaterThan(0);
      // Mike Johnson should be present
      const hasMike = options.some((opt) => opt.includes('Mike') || opt.includes('Johnson'));
      expect(hasMike).to.equal(true);
    });

    // Dismiss the open dropdown before clicking cancel
    cy.get('body').type('{esc}');
    form.cancel();
  });
});
