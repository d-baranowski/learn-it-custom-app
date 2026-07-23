/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

/**
 * Component Object for Therapist–Customer Assignment Form
 * Encapsulates interactions with the form that links a therapist to a customer
 *
 * NOTE: The Therapist Customer Link form currently lacks data-testid attributes
 * on its input fields. We use label-based selectors as a workaround.
 * TODO: Request UI devs add data-testid="therapist-id" and data-testid="customer-id"
 */
export class TherapistCustomerFormComponent {
  readonly selectors = {
    // The "+ New" button shares the same data-testid across grid pages
    newButton: '[data-testid="create-item-btn"]',
    // TODO: add data-testid="form-submit-btn" to Save button in Therapist Customer form
    submitButton: 'button[type="submit"]',
    cancelButton: 'button[type="button"]',
    // Use the title text to find the custom window container
    formTitle: 'h2:contains("Create Therapist Customer Link")',
  };

  private getForm(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('h2', 'Create Therapist Customer Link').parent();
  }

  clickNew(): this {


    cylog('TherapistCustomer: clickNew');
    cy.get(this.selectors.newButton).click();
    // Wait for the form dialog to appear by title
    cy.get(this.selectors.formTitle, { timeout: 10000 }).should('be.visible');
    return this;
  }

  /**
   * Select a therapist from the autocomplete dropdown.
   * Uses label-based selection since the input lacks a data-testid.
   */
  selectTherapist(therapistName: string): this {
    // Find the Therapist autocomplete input by its label text
    // TODO: Replace with data-testid="therapist-id" once added to UI
    this.getForm().contains('label', 'Therapist').parent().find('input[role="combobox"]').click();
    cy.get('[role="option"]', { timeout: 25000 })
      .should('be.visible')
      .contains(therapistName)
      .click();
    return this;
  }

  /**
   * Select a customer from the autocomplete dropdown.
   * Uses label-based selection since the input lacks a data-testid.
   */
  selectCustomer(customerName: string): this {
    // TODO: Replace with data-testid="customer-id" once added to UI
    this.getForm().contains('label', 'Customer').parent().find('input[role="combobox"]').click();
    cy.get('[role="option"]', { timeout: 25000 })
      .should('be.visible')
      .contains(customerName)
      .click();
    return this;
  }

  submit(): this {
    cylog('TherapistCustomer: submit');
    this.getForm().find(this.selectors.submitButton).should('not.be.disabled').click();
    return this;
  }

  cancel(): this {
    cylog('TherapistCustomer: cancel');
    this.getForm().find(this.selectors.cancelButton).contains('Cancel').click();
    return this;
  }

  waitForFormLoad(): this {
    this.getForm().should('be.visible');
    return this;
  }
}
