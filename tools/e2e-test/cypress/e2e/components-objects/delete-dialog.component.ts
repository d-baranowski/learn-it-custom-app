/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

/**
 * Component Object for Delete Confirmation Dialog
 * Encapsulates all interactions with the delete confirmation dialog
 */
export class DeleteDialog {
  selectors: {
    dialogRoot: string;
    confirmButton: string;
    cancelButton: string;
  };

  constructor() {
    this.selectors = {
      // Using data-testid selectors added to ConfirmProvider
      dialogRoot: '[data-testid="confirm-dialog"]',
      confirmButton: '[data-testid="confirm-dialog-confirm-button"]',
      cancelButton: '[data-testid="confirm-dialog-cancel-button"]',
    };
  }

  /**
   * Click any button by its data-testid attribute
   * @param dataTestId - The data-testid value of the button
   */
  clickButton(dataTestId: string): this {
    cy.get(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  confirm(): this {
    cylog('delete: confirming deletion');
    this.waitForDialog();
    this.clickButton('confirm-dialog-confirm-button');
    // The dialog closing signals the confirm handler ran. Completion of the
    // async delete is asserted by the caller against durable UI state (the row
    // is gone from the grid) — never a success toast, which auto-dismisses
    // before it can be reliably observed.
    this.shouldNotBeVisible();
    return this;
  }

  cancel(): this {


    cylog('delete: cancelling deletion');
    this.waitForDialog();
    this.clickButton('confirm-dialog-cancel-button');
    return this;
  }

  isVisible(): Cypress.Chainable<boolean> {
    return cy.get(this.selectors.dialogRoot).then(($el) => $el.is(':visible'));
  }

  /**
   * Wait for the dialog to appear
   * @param timeout - Optional timeout in milliseconds
   */
  waitForDialog(timeout: number = 10000): this {
    cy.get(this.selectors.dialogRoot, { timeout }).should('be.visible');
    return this;
  }

  shouldBeVisible(): this {
    cy.get(this.selectors.dialogRoot).should('be.visible');
    return this;
  }

  shouldNotBeVisible(): this {
    cy.get(this.selectors.dialogRoot).should('not.exist');
    return this;
  }
}
