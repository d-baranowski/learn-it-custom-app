/// <reference types="cypress" />

import { AutocompleteComponent } from './autocomplete.component';

export function closeWindowIfOpen(): void {
  cy.get('body').then(($body) => {
    const $btn = $body.find('[data-testid="window-close-btn"]:visible');
    if ($btn.length > 0) {
      ($btn[0] as HTMLElement).click();
    }
  });
}

export class FormComponent {
  private readonly autocomplete = new AutocompleteComponent();

  selectors: {
    newButton: string;
    submitButton: string;
    cancelButton: string;
    option: string;
    autocompletePopper: string;
    errorBadge: string;
    errorClass: string;
    formControl: string;
    formWrapper: string;
  };

  constructor() {
    this.selectors = {
      newButton: '[data-testid="create-item-btn"]',
      submitButton: '[data-testid="form-submit-btn"]',
      cancelButton: '[data-testid="form-cancel-btn"]',
      option: '[role="option"]',
      autocompletePopper: '.MuiAutocomplete-popper',
      errorBadge: '.MuiBadge-colorError',
      errorClass: '.Mui-error',
      formControl: '.MuiFormControl-root',
      formWrapper: '[data-testid="tabular-form-wrapper"]',
    };
  }

  clickButton(dataTestId: string): this {
    cy.get(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  fillInput(dataTestId: string, value: string, clear: boolean = true): this {
    const selector = `input[data-testid="${dataTestId}"]`;
    if (clear) {
      cy.get(selector).clear();
      if (value !== '') {
        cy.get(selector).type(value);
      }
    } else {
      cy.get(selector).type(value);
    }
    return this;
  }

  clearInput(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`).clear();
    return this;
  }

  selectDropdown(
    dataTestId: string,
    optionText: string | null = null,
    selectFirst: boolean = false
  ): this {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    cy.get('[role="option"]', { timeout: 30000 }).should('be.visible');
    if (selectFirst || optionText === null) {
      cy.get('[role="option"]').first().click();
    } else {
      cy.get('[role="option"]').contains(optionText).click();
    }
    return this;
  }

  selectMultiDropdown(
    dataTestId: string,
    optionTexts: string[],
    closeAfter: boolean = true
  ): this {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    optionTexts.forEach((text) => {
      cy.get('[role="option"]', { timeout: 30000 })
        .should('be.visible')
        .contains(text)
        .click();
    });
    if (closeAfter) {
      this.dismissDropdown();
    }
    return this;
  }

  getDropdownOptions(dataTestId: string): Cypress.Chainable<string[]> {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    return cy
      .get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .then(($options) => {
        return Cypress._.map(
          $options,
          (option) => option.textContent?.trim() || ''
        );
      });
  }

  hasDropdownOption(
    dataTestId: string,
    text: string
  ): Cypress.Chainable<boolean> {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    return cy
      .get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .then(($options) => {
        return Cypress._.some(
          $options,
          (option) => option.textContent?.includes(text) || false
        );
      });
  }

  getDropdownOptionCount(dataTestId: string): Cypress.Chainable<number> {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    return cy
      .get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .then(($options) => $options.length);
  }

  getInputValue(dataTestId: string): Cypress.Chainable<string> {
    return cy.get(`input[data-testid="${dataTestId}"]`).invoke('val');
  }

  closeDropdown(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`).click();
    return this;
  }

  hasFieldError(fieldName: string): Cypress.Chainable<boolean> {
    return cy
      .get(`input[data-testid="${fieldName}"], input[name="${fieldName}"]`)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .then(($el) => $el.length > 0);
  }

  shouldHaveFieldError(fieldName: string): this {
    cy.get(`input[data-testid="${fieldName}"], input[name="${fieldName}"]`)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('exist');
    return this;
  }

  hasTabError(tabTestId: string): Cypress.Chainable<boolean> {
    return cy
      .get(`[data-testid="${tabTestId}"]`)
      .parent('.MuiBadge-root')
      .find(this.selectors.errorBadge)
      .then(($el) => $el.length > 0);
  }

  shouldHaveTabError(tabTestId: string): this {
    cy.get(`[data-testid="${tabTestId}"]`)
      .parent('.MuiBadge-root')
      .find(this.selectors.errorBadge)
      .should('exist');
    return this;
  }

  isSubmitDisabled(): Cypress.Chainable<boolean> {
    return cy
      .get(this.selectors.submitButton)
      .then(($btn) => $btn.prop('disabled') as boolean);
  }

  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.submitButton, { timeout: 10000 }).should(
      'be.disabled'
    );
    return this;
  }

  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.submitButton).should('not.be.disabled');
    return this;
  }

  clickSave(): this {
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  assertSaving(): this {
    cy.get(this.selectors.submitButton).should('have.attr', 'data-saving', 'true');
    return this;
  }

  assertNotSaving(): this {
    cy.get(this.selectors.submitButton, { timeout: 15000 }).should(
      'have.attr',
      'data-saving',
      'false'
    );
    return this;
  }

  closeWindow(): this {
    cy.get('[data-testid="window-close-btn"]').click();
    return this;
  }

  closeWindowIfOpen(): this {
    closeWindowIfOpen();
    return this;
  }

  shouldHaveInputValue(dataTestId: string, expectedValue: string): this {
    this.getInputValue(dataTestId).should('eq', expectedValue);
    return this;
  }

  shouldHaveError(dataTestId?: string): this {
    if (dataTestId) {
      cy.get(`input[data-testid="${dataTestId}"]`)
        .closest(this.selectors.formControl)
        .find(this.selectors.errorClass)
        .should('exist');
    } else {
      cy.get(this.selectors.errorClass).should('exist');
    }
    return this;
  }

  shouldNotHaveError(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('not.exist');
    return this;
  }

  getErrorMessage(dataTestId: string): Cypress.Chainable<string> {
    return cy
      .get(`input[data-testid="${dataTestId}"]`)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .invoke('text');
  }

  shouldHaveErrorBadge(): this {
    cy.get(this.selectors.errorBadge).should('exist');
    return this;
  }

  getDropdownOptionsCount(dataTestId: string): Cypress.Chainable<number> {
    this.dismissDropdown();
    this.autocomplete.open(`input[data-testid="${dataTestId}"]`);
    return cy
      .get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .then(($options) => $options.length);
  }

  isFormOpen(): Cypress.Chainable<boolean> {
    return cy
      .get(this.selectors.formWrapper)
      .then(($el) => $el.length > 0);
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.formWrapper).should('exist');
    return this;
  }

  waitForFormClose(timeout: number = 10000): this {
    this.closeWindowIfOpen();
    cy.get(this.selectors.formWrapper, { timeout }).should('not.exist');
    return this;
  }

  removeRequiredAttribute(dataTestId: string): this {
    const fieldSelector = `input[data-testid="${dataTestId}"]`;
    cy.get(fieldSelector).then(($input) => {
      cy.wrap($input).invoke('removeAttr', 'required');
    });
    return this;
  }

  private dismissDropdown(): void {
    cy.get('body').then(($body) => {
      if ($body.find('.MuiAutocomplete-popper').length > 0) {
        cy.get('body').type('{esc}');
        cy.get('.MuiAutocomplete-popper').should('not.exist');
      }
    });
  }

}
