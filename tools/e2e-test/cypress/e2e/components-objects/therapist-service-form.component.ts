/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for the Therapist Service Link form
 * Encapsulates all interactions with the create/edit therapist service link dialog
 */
export class TherapistServiceFormComponent {
  selectors: {
    addItemButton: string;
    // TODO: add data-testid to UI for Save button in therapist service form
    submitButton: string;
    formDialog: string;
    therapistId: string;
    serviceId: string;
    price: string;
    option: string;
  };

  constructor() {
    this.selectors = {
      addItemButton: '[data-testid="create-item-btn"]',
      submitButton: 'button[type="submit"]',
      formDialog: '[data-testid="dialog2-container"]',
      therapistId: 'input[data-testid="therapist-id"]',
      serviceId: 'input[data-testid="service-id"]',
      price: 'input[data-testid="price"]',
      option: '[role="option"]',
    };
  }

  /** Click the New button to open the create form */
  clickAddItem(): this {

    cylog('TherapistService: clickAddItem');
    cy.get(this.selectors.addItemButton).click();
    return this;
  }

  /** Wait for the form dialog to be visible */
  waitForFormLoad(): this {
    cy.get(this.selectors.formDialog, { timeout: 10000 }).should('be.visible');
    return this;
  }

  /** Wait for the form to close */
  waitForFormClose(timeout: number = 10000): this {
    closeWindowIfOpen();
    cy.get(this.selectors.formDialog, { timeout }).should('not.exist');
    return this;
  }

  /**
   * Select a therapist from the Therapist dropdown
   * @param therapistName - The therapist name to select
   */
  selectTherapist(therapistName: string): this {
    cy.get(this.selectors.therapistId).click();
    cy.get(this.selectors.option, { timeout: 25000 })
      .should('be.visible')
      .contains(therapistName)
      .click();
    return this;
  }

  /**
   * Select a service from the Service dropdown
   * @param serviceName - The service name to select
   */
  selectService(serviceName: string): this {
    cy.get(this.selectors.serviceId).click();
    cy.get(this.selectors.option, { timeout: 25000 })
      .should('be.visible')
      .contains(serviceName)
      .click();
    return this;
  }

  /**
   * Fill the Price field
   * @param value - The price value
   */
  fillPrice(value: string): this {
    cy.get(this.selectors.price).clear();
    cy.get(this.selectors.price).type(value);
    return this;
  }

  /** Click the Save button */
  clickSave(): this {

    cylog('TherapistService: clickSave');
    cy.get(this.selectors.formDialog).find(this.selectors.submitButton).click();
    return this;
  }

  /** Click the Cancel button */
  clickCancel(): this {
    cy.get(this.selectors.formDialog).contains('button', 'Cancel').click();
    return this;
  }

  /** Verify the Save button is disabled (form validation prevents submission) */
  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.formDialog).find(this.selectors.submitButton).should('be.disabled');
    return this;
  }

  /** Verify the Save button is enabled */
  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.formDialog).find(this.selectors.submitButton).should('not.be.disabled');
    return this;
  }

  /** Verify the New button does not exist (for non-admin) */
  shouldNotHaveNewButton(): this {
    cy.get(this.selectors.addItemButton).should('not.exist');
    return this;
  }

  /** Verify the New / add-item button is visible (for admin / permitted users). */
  shouldHaveNewButton(): this {
    cy.get(this.selectors.addItemButton).should('be.visible');
    return this;
  }

  /** Verify the Price input holds the given value. */
  shouldHavePrice(value: string): this {
    cy.get(this.selectors.price).should('have.value', value);
    return this;
  }

  /** Verify the Therapist autocomplete is populated (non-empty). */
  shouldHaveTherapistPopulated(): this {
    cy.get(this.selectors.therapistId).should('not.have.value', '');
    return this;
  }

  /** Verify the Service autocomplete is populated (non-empty). */
  shouldHaveServicePopulated(): this {
    cy.get(this.selectors.serviceId).should('not.have.value', '');
    return this;
  }

  /** Verify the Price input holds a positive number. */
  shouldHavePricePopulated(): this {
    cy.get(this.selectors.price)
      .invoke('val')
      .then((val) => {
        expect(Number(val)).to.be.greaterThan(0);
      });
    return this;
  }
}
