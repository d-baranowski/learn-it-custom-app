/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for User Form
 * Encapsulates all interactions with the user create/edit form
 */
export class UserFormComponent {
  readonly selectors = {
    displayNameInput: 'input[data-testid="display-name"]',
    abbreviationInput: 'input[data-testid="display-abbreviation"]',
    usernameInput: 'input[data-testid="username"]',
    emailInput: 'input[data-testid="email"]',
    disabledCheckbox: '[data-test-form-field-name="disabled"] input[type="checkbox"]',
    newButton: '[data-testid="create-item-btn"]',
    // StandardForm uses FormControlButtons which has no data-testid on buttons.
    // button[type="submit"] is unambiguous when the form dialog is open.
    submitButton: 'button[type="submit"]',
    cancelButton: 'button[type="button"]',
  };

  clickNew(): this {


    cylog('User: clickNew');
    cy.get(this.selectors.newButton).click();
    return this;
  }

  fillDisplayName(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.displayNameInput).clear();
      cy.get(this.selectors.displayNameInput).type(value);
    } else {
      cy.get(this.selectors.displayNameInput).type(value);
    }
    return this;
  }

  fillAbbreviation(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.abbreviationInput).clear();
      cy.get(this.selectors.abbreviationInput).type(value);
    } else {
      cy.get(this.selectors.abbreviationInput).type(value);
    }
    return this;
  }

  fillUsername(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.usernameInput).clear();
      cy.get(this.selectors.usernameInput).type(value);
    } else {
      cy.get(this.selectors.usernameInput).type(value);
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

  /**
   * Fill multiple user form fields in one call.
   * @param options - Fields to fill
   * @param clear - Whether to clear before typing (default: true)
   */
  fillUserDetails(
    options: {
      displayName?: string;
      abbreviation?: string;
      username?: string;
      email?: string;
    },
    clear = true
  ): this {
    const { displayName, abbreviation, username, email } = options;
    if (displayName !== undefined) this.fillDisplayName(displayName, clear);
    if (abbreviation !== undefined) this.fillAbbreviation(abbreviation, clear);
    if (username !== undefined) this.fillUsername(username, clear);
    if (email !== undefined) this.fillEmail(email, clear);
    return this;
  }

  /**
   * Toggle the disabled checkbox.
   * Use force:true because MUI checkbox input may be visually hidden.
   */
  toggleDisabled(): this {
    cy.get(this.selectors.disabledCheckbox).click({ force: true });
    return this;
  }

  submit(): this {


    cylog('User: submit');
    cy.get(this.selectors.submitButton).click();
    closeWindowIfOpen();
    cy.get(this.selectors.displayNameInput, { timeout: 15000 }).should(
      'not.exist'
    );
    return this;
  }

  cancel(): this {


    cylog('User: cancel');
    // The cancel button has no data-testid. Use text content to find it
    // within the form context. We look for the specific Cancel button
    // rendered by FormControlButtons next to the submit button.
    cy.get(this.selectors.submitButton)
      .parent()
      .contains('button', 'Cancel')
      .click();
    return this;
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.displayNameInput, { timeout: 10000 }).should(
      'exist'
    );
    return this;
  }

  shouldHaveDisplayName(expected: string): this {
    cy.get(this.selectors.displayNameInput).should('have.value', expected);
    return this;
  }

  shouldHaveAbbreviation(expected: string): this {
    cy.get(this.selectors.abbreviationInput).should('have.value', expected);
    return this;
  }

  shouldHaveUsername(expected: string): this {
    cy.get(this.selectors.usernameInput).should('have.value', expected);
    return this;
  }

  shouldHaveEmail(expected: string): this {
    cy.get(this.selectors.emailInput).should('have.value', expected);
    return this;
  }

  shouldBeDisabled(checked: boolean): this {
    if (checked) {
      cy.get(this.selectors.disabledCheckbox).should('be.checked');
    } else {
      cy.get(this.selectors.disabledCheckbox).should('not.be.checked');
    }
    return this;
  }

  shouldNotHaveNewButton(): this {
    cy.get(this.selectors.newButton).should('not.exist');
    return this;
  }

  shouldHaveSaveButtonDisabled(): this {
    cy.get(this.selectors.submitButton).should('be.disabled');
    return this;
  }
}
