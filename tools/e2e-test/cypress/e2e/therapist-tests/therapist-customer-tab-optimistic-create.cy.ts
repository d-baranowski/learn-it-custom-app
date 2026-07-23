/// <reference types="cypress" />

/**
 * THR_E2E_CUST_TAB_OPTIMISTIC — Creating a therapist-customer link from the
 * Therapist Customer tab inside therapist form should update the inner grid
 * while save is still in flight.
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistFormComponent } from '../components-objects/therapist-form.component';
import { ToastComponent } from '../components-objects/toast.component';
import { createCustomer, ADAM_FULL_NAME } from '../customer-tests/customer-test-utils';
import { navigateToTherapistPage } from './therapist-test-utils';

describe('Therapist → Therapist Customer Tab → Optimistic Create', () => {
  let customerFirstName = '';
  let customerLastName = '';

  beforeEach(() => {
    cy.login();

    const suffix = Date.now().toString().slice(-6);
    customerFirstName = `E2EFirst${suffix}`;
    customerLastName = `E2ELast${suffix}`;

    const nav = new NavigationHelper();
    nav.navigateToCustomer();
    createCustomer({
      firstName: customerFirstName,
      lastName: customerLastName,
      email: `e2e-optimistic-${suffix}@utro-test.com`,
    });

    navigateToTherapistPage();
  });

  it('THR_CUST_E2E_02: should reflect new link in inner grid while save is in flight', { tags: '@mutating' }, () => {
    const outerGrid = new GridComponent();
    const innerGrid = new GridComponent('[data-form-entity="therapist"]');
    const therapistForm = new TherapistFormComponent();
    const toast = new ToastComponent();

    outerGrid.openRow(ADAM_FULL_NAME, true);
    therapistForm.waitForFormLoad();
    cy.get(therapistForm.selectors.formTabs).contains('Therapist Customer').click();
    innerGrid.waitForGrid();

    cy.get('[data-form-entity="therapist"]')
      .find('[data-testid="add-item-grid-btn"]', { timeout: 15000 })
      .filter(':visible')
      .first()
      .as('innerAddBtn');
    cy.get('@innerAddBtn').scrollIntoView();
    cy.get('@innerAddBtn').click({ force: true });

    cy.get('input[data-testid="therapist-id"]', { timeout: 15000 })
      .should('exist')
      .as('therapistInput');

    cy.get('@therapistInput').invoke('val').should('contain', 'Adam');

    cy.get('input[data-testid="customer-id"]').click();
    cy.get('[role="option"]', { timeout: 30000 })
      .contains(`${customerLastName} ${customerFirstName}`)
      .click();

    // Delay create response to guarantee an observable in-flight window.
    cy.intercept('POST', '**/core.v1.TherapistCustomerLinkService/Create', (req) => {
      req.continue((res) => {
        res.setDelay(1200);
      });
    }).as('createTherapistCustomerLink');

    cy.get('@therapistInput')
      .closest('form')
      .find('[data-testid="form-submit-btn"]')
      .click();

    // In-flight + reflected row before backend resolution.
    cy.get('@therapistInput')
      .closest('form')
      .find('[data-testid="form-submit-btn"]')
      .should('have.attr', 'data-saving', 'true');

    cy.get('[data-form-entity="therapist"] [data-testid="rpg-grid-component-wrapper"]')
      .should('contain.text', customerLastName);

    cy.wait('@createTherapistCustomerLink', { timeout: 30000 })
      .its('response.statusCode')
      .should('eq', 200);

    toast.expectSuccess();
    cy.get('input[data-testid="therapist-id"]', { timeout: 15000 }).should('not.exist');
    innerGrid.shouldContain(customerLastName);

    cy.get('[data-testid="window-close-btn"]').click();
    cy.get('[data-form-entity="therapist"]').should('not.exist');
  });
});
