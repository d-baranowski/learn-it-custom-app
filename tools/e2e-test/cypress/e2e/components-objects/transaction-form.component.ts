/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for Transaction Form
 * Encapsulates all interactions with the transaction form (create/edit)
 */
export class TransactionFormComponent {
  selectors: {
    formWrapper: string;
    basicInfoTab: string;
    nameInput: string;
    amountInput: string;
    incurredAtInput: string;
    submitButton: string;
    cancelButton: string;
    newButton: string;
    errorClass: string;
    formControl: string;
  };

  constructor() {
    this.selectors = {
      formWrapper: '[data-testid="tabular-form-wrapper"]',
      basicInfoTab: '[data-testid="tab-basic-information"]',
      nameInput: 'input[data-testid="display-name"]',
      amountInput: 'input[data-testid="amount"]',
      incurredAtInput: 'input[data-testid="incurred-at"]',
      submitButton: '[data-testid="form-submit-btn"]',
      cancelButton: '[data-testid="form-cancel-btn"]',
      newButton: '[data-testid="create-item-btn"]',
      errorClass: '.Mui-error',
      formControl: '.MuiFormControl-root',
    };
  }

  clickNew(): this {


    cylog('Transaction: clickNew');
    cy.get(this.selectors.newButton).click();
    return this;
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.formWrapper).should('exist');
    cy.get(this.selectors.nameInput).should('exist');
    return this;
  }

  waitForFormClose(timeout: number = 10000): this {
    closeWindowIfOpen();
    cy.get(this.selectors.formWrapper, { timeout }).should('not.exist');
    return this;
  }

  fillName(name: string): this {
    cy.get(this.selectors.nameInput).clear();
    if (name !== '') {
      cy.get(this.selectors.nameInput).type(name);
    }
    return this;
  }

  fillAmount(amount: string): this {
    cy.get(this.selectors.amountInput).clear();
    if (amount !== '') {
      cy.get(this.selectors.amountInput).type(amount);
    }
    return this;
  }

  fillIncurredAt(date: string): this {
    const sel = this.selectors.incurredAtInput;
    cy.get(sel).click({ force: true });
    cy.get(sel).type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}', { force: true });
    const [dd, mm, yyyy] = date.split('/');
    cy.get(sel).type(dd, { force: true, delay: 100 });
    cy.get(sel).type(mm, { force: true, delay: 100 });
    cy.get(sel).type(yyyy, { force: true, delay: 100 });
    cy.get(sel).type('{esc}', { force: true });
    return this;
  }

  submit(): this {


    cylog('Transaction: submit');
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  cancel(): this {


    cylog('Transaction: cancel');
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  shouldHaveFieldError(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('exist');
    return this;
  }
}
