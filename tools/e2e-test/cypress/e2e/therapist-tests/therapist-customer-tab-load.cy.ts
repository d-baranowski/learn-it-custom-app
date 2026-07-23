/// <reference types="cypress" />

/**
 * THR_E2E_CUST_TAB_01 — Opening the Therapist Customer tab inside therapist
 * edit form must load linked customers in the embedded grid.
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistFormComponent } from '../components-objects/therapist-form.component';
import { createCustomer, assignCustomerToTherapist, ADAM_FULL_NAME } from '../customer-tests/customer-test-utils';
import { navigateToTherapistPage } from './therapist-test-utils';

describe('Therapist → Therapist Customer Tab', () => {
  let customerFirstName = '';
  let customerLastName = '';

  beforeEach(() => {
    cy.login();

    const suffix = Date.now().toString().slice(-6);
    customerFirstName = `E2EFirst${suffix}`;
    customerLastName = `E2ELast${suffix}`;

    const nav = new NavigationHelper();

    // Seed one unique customer and assign it to Adam so the therapist tab has
    // at least one linked row to load.
    nav.navigateToCustomer();
    createCustomer({
      firstName: customerFirstName,
      lastName: customerLastName,
      email: `e2e-customer-${suffix}@utro-test.com`,
    });
    assignCustomerToTherapist(ADAM_FULL_NAME, `${customerLastName} ${customerFirstName}`);

    navigateToTherapistPage();
  });

  it('THR_CUST_E2E_01: should load customers when opening Therapist Customer tab', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const form = new TherapistFormComponent();

    // Open Adam therapist form in edit mode (tab exists only for edit).
    grid.openRow(ADAM_FULL_NAME, true);
    form.waitForFormLoad();

    // Must wait for therapist-customer list call fired by tab mount.
    cy.intercept('POST', '**/core.v1.TherapistCustomerLinkService/List').as('listTherapistCustomerLinks');

    cy.get(form.selectors.formTabs).contains('Therapist Customer').click();
    cy.wait('@listTherapistCustomerLinks', { timeout: 30000 })
      .its('response.statusCode')
      .should('eq', 200);

    // Inner grid lives inside the therapist form.
    cy.get(
      '[data-form-entity="therapist"] [data-testid="rpg-grid-component-wrapper"]',
      { timeout: 15000 },
    ).as('innerGrid');

    cy.get('@innerGrid')
      .find('tbody tr[data-id]', { timeout: 15000 })
      .should('have.length.gte', 1);

    cy.get('@innerGrid').should('contain.text', customerLastName);

    // Close therapist form via window close button (footer is hidden on this tab).
    cy.get('[data-testid="window-close-btn"]').click();
    cy.get('[data-form-entity="therapist"]').should('not.exist');
  });
});
