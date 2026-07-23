/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for Recurring Cashflow Form
 * Encapsulates all interactions with the recurring cashflow form (create/edit)
 */
export class RecurringCashflowFormComponent {
  selectors: {
    formWrapper: string;
    formTabs: string;
    basicInfoTab: string;
    frequencyTab: string;
    nameInput: string;
    amountInput: string;
    startDateInput: string;
    endDateInput: string;
    submitButton: string;
    cancelButton: string;
    newButton: string;
    errorBadge: string;
    errorClass: string;
    formControl: string;
  };

  constructor() {
    this.selectors = {
      formWrapper: '[data-testid="tabular-form-wrapper"]',
      formTabs: '[data-testid="form-tabs"]',
      basicInfoTab: '[data-testid="tab-basic-information"]',
      frequencyTab: '[data-testid="tab-frequency"]',
      nameInput: 'input[data-testid="display-name"]',
      amountInput: 'input[data-testid="amount"]',
      startDateInput: 'input[data-testid="start-date"]',
      endDateInput: 'input[data-testid="end-date"]',
      submitButton: '[data-testid="form-submit-btn"]',
      cancelButton: '[data-testid="form-cancel-btn"]',
      newButton: '[data-testid="create-item-btn"]',
      errorBadge: '.MuiBadge-colorError',
      errorClass: '.Mui-error',
      formControl: '.MuiFormControl-root',
    };
  }

  clickNew(): this {


    cylog('RecurringCashflow: clickNew');
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

  fillStartDate(date: string): this {
    const sel = this.selectors.startDateInput;
    cy.get(sel).click({ force: true });
    cy.get(sel).type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}', { force: true });
    const [dd, mm, yyyy] = date.split('/');
    cy.get(sel).type(dd, { force: true, delay: 100 });
    cy.get(sel).type(mm, { force: true, delay: 100 });
    cy.get(sel).type(yyyy, { force: true, delay: 100 });
    cy.get(sel).type('{esc}', { force: true });
    return this;
  }

  fillEndDate(date: string): this {
    const sel = this.selectors.endDateInput;
    cy.get(sel).click({ force: true });
    cy.get(sel).type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}', { force: true });
    const [dd, mm, yyyy] = date.split('/');
    cy.get(sel).type(dd, { force: true, delay: 100 });
    cy.get(sel).type(mm, { force: true, delay: 100 });
    cy.get(sel).type(yyyy, { force: true, delay: 100 });
    cy.get(sel).type('{esc}', { force: true });
    return this;
  }

  navigateToTab(tabName: string): this {
    if (tabName === 'Basic Information') {
      cy.get(this.selectors.basicInfoTab).click();
    } else if (tabName === 'Frequency') {
      cy.get(this.selectors.frequencyTab).click();
    }
    return this;
  }

  addSchedule(): this {
    this.navigateToTab('Frequency');
    cy.contains('button', 'Add Schedule').click();
    return this;
  }

  submit(): this {


    cylog('RecurringCashflow: submit');
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  cancel(): this {


    cylog('RecurringCashflow: cancel');
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

  shouldHaveTabError(tabName: string): this {
    const tabSelector =
      tabName === 'Basic Information' ? this.selectors.basicInfoTab : this.selectors.frequencyTab;
    cy.get(tabSelector).parent('.MuiBadge-root').find(this.selectors.errorBadge).should('exist');
    return this;
  }

  shouldHaveInputValue(dataTestId: string, expectedValue: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`).should('have.value', expectedValue);
    return this;
  }
}
