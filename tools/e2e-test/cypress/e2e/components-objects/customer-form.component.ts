/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for Customer Form
 * Encapsulates all interactions with the customer create/edit form
 */
export class CustomerFormComponent {
  readonly selectors = {
    firstNameInput: 'input[data-testid="first-name"]',
    lastNameInput: 'input[data-testid="last-name"]',
    emailInput: 'input[data-testid="email"]',
    // TODO: add data-testid="phone-number" to phone input in UI — field name unconfirmed
    phoneNumberInput: 'input[data-testid="phone-number"]',
    // TODO: add data-testid="address" to address input in UI — field name unconfirmed
    addressInput: 'input[data-testid="address"]',
    newButton: '[data-testid="create-item-btn"]',
    // Using type selector rather than data-testid="form-submit-btn" intentionally:
    // when the edit form is open the only submit button in the DOM is the form's Save button,
    // so button[type="submit"] is unambiguous and avoids picking up any hidden/background
    // element that may share the data-testid on the customer list page.
    submitButton: 'button[type="submit"]',
    // TODO: add data-testid="form-cancel-btn" to Cancel button in customer form in UI
    cancelButton: 'button[type="button"]',
  };

  clickNew(): this {


    cylog('Customer: clickNew');
    cy.get(this.selectors.newButton).click();
    return this;
  }

  fillFirstName(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.firstNameInput).clear();
      cy.get(this.selectors.firstNameInput).type(value);
    } else {
      cy.get(this.selectors.firstNameInput).type(value);
    }
    return this;
  }

  fillLastName(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.lastNameInput).clear();
      cy.get(this.selectors.lastNameInput).type(value);
    } else {
      cy.get(this.selectors.lastNameInput).type(value);
    }
    return this;
  }

  fillEmail(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.emailInput).clear();
      cy.get(this.selectors.emailInput).type(value);
    } else {
      cy.get(this.selectors.emailInput).type(value);
    }
    return this;
  }

  fillPhoneNumber(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.phoneNumberInput).clear();
      cy.get(this.selectors.phoneNumberInput).type(value);
    } else {
      cy.get(this.selectors.phoneNumberInput).type(value);
    }
    return this;
  }

  fillAddress(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.addressInput).clear();
      cy.get(this.selectors.addressInput).type(value);
    } else {
      cy.get(this.selectors.addressInput).type(value);
    }
    return this;
  }

  /**
   * Fill all customer fields in one call.
   * Pass clear=false on the first interaction with a fresh form.
   */
  fillCustomerDetails(
    options: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      address?: string;
    },
    clear = true
  ): this {
    const { firstName, lastName, email, phoneNumber, address } = options;
    if (firstName !== undefined) this.fillFirstName(firstName, clear);
    if (lastName !== undefined) this.fillLastName(lastName, clear);
    if (email !== undefined) this.fillEmail(email, clear);
    if (phoneNumber !== undefined) this.fillPhoneNumber(phoneNumber, clear);
    if (address !== undefined) this.fillAddress(address, clear);
    return this;
  }

  submit(): this {


    cylog('Customer: submit');
    cy.get(this.selectors.submitButton).click();
    closeWindowIfOpen();
    cy.get(this.selectors.firstNameInput, { timeout: 15000 }).should('not.exist');
    return this;
  }

  cancel(): this {


    cylog('Customer: cancel');
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.firstNameInput, { timeout: 10000 }).should('exist');
    return this;
  }

  shouldHaveFirstName(expected: string): this {
    cy.get(this.selectors.firstNameInput).should('have.value', expected);
    return this;
  }

  shouldHaveLastName(expected: string): this {
    cy.get(this.selectors.lastNameInput).should('have.value', expected);
    return this;
  }

  shouldHaveEmail(expected: string): this {
    cy.get(this.selectors.emailInput).should('have.value', expected);
    return this;
  }

  shouldHavePhoneNumber(expected: string): this {
    cy.get(this.selectors.phoneNumberInput).should('have.value', expected);
    return this;
  }

  shouldHaveAddress(expected: string): this {
    cy.get(this.selectors.addressInput).should('have.value', expected);
    return this;
  }

  shouldNotHaveNewButton(): this {
    cy.get(this.selectors.newButton).should('not.exist');
    return this;
  }

  /**
   * Assert that the save button is disabled.
   * Used to document cases where the UI restricts saving for certain user roles.
   */
  shouldHaveSaveButtonDisabled(): this {
    cy.get(this.selectors.submitButton).should('be.disabled');
    return this;
  }
}
