/// <reference types="cypress" />

import { GridComponent } from './grid.component';
import { TherapyFormComponent } from './therapy-form.component';

/**
 * Component Object for the Update Session Prices dialog.
 *
 * The dialog opens inside the RPG window manager with
 * data-window-id="update-session-prices" (grid action) or
 * data-window-id="session-update-prices" (therapy form action).
 *
 * All interactive elements are addressed via data-testid attributes.
 */
export class SessionPriceUpdateComponent {
  /** Selector for the window container. */
  private windowSelector: string;

  constructor(windowId = 'update-session-prices') {
    this.windowSelector = `[data-window-id="${windowId}"]`;
  }

  // ── Open helpers ──────────────────────────────────────────────────────

  /**
   * Open the dialog from the grid's Actions menu for a single selected row.
   * Expects an instance constructed with the default window id
   * ("update-session-prices"). No-op if the window is already open.
   */
  openFromGridActions(rowName: string): this {
    cy.get('body').then(($body) => {
      if ($body.find(this.windowSelector).length > 0) return;
      const grid = new GridComponent();
      grid.waitForGrid();
      grid.clearSelection();
      grid.selectRow(rowName);
      grid
        .findRow(rowName)
        .find(grid.selectors.checkbox)
        .should('be.checked');
      grid.openActionsMenu();
      cy.get('[data-testid="update-session-prices-action"]').click({
        force: true,
      });
      cy.get('body').type('{esc}');
    });
    return this.waitForWindow();
  }

  /**
   * Open the dialog from the therapy form's actions dropdown.
   * Expects an instance constructed with window id "session-update-prices".
   * No-op if the window is already open.
   */
  openFromTherapyForm(): this {
    cy.get('body').then(($body) => {
      if ($body.find(this.windowSelector).length > 0) return;
      cy.get('[data-testid="form-actions-dropdown-btn"]')
        .should('be.visible')
        .click();
      new TherapyFormComponent().clickUpdateSessionPricesBtn();
    });
    return this.waitForWindow();
  }

  // ── Wait helpers ──────────────────────────────────────────────────────

  /** Wait until the window is visible in the DOM. */
  waitForWindow(timeout = 15000): this {
    cy.get(this.windowSelector, { timeout }).should('be.visible');
    return this;
  }

  /** Wait until the window has been removed from the DOM. */
  waitForWindowClose(timeout = 10000): this {
    cy.get(this.windowSelector, { timeout }).should('not.exist');
    return this;
  }

  // ── Date range ────────────────────────────────────────────────────────

  /** Get the "From" input element. */
  getFromInput(): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get(this.windowSelector)
      .find('[data-testid="price-update-from-input"]');
  }

  /** Get the "Until" input element. */
  getUntilInput(): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get(this.windowSelector)
      .find('[data-testid="price-update-until-input"]');
  }

  /**
   * Type a date into a MUI DatePicker sectioned input.
   * Format: DD/MM/YYYY
   */
  fillDate(testId: string, dateFormatted: string): this {
    const [dd, mm, yyyy] = dateFormatted.split('/');
    const sel = `[data-testid="${testId}"]`;

    cy.get(this.windowSelector).find(sel).click({ force: true });
    cy.get(this.windowSelector)
      .find(sel)
      .type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}', {
        force: true,
      });
    cy.get(this.windowSelector).find(sel).type(dd, { force: true, delay: 100 });
    cy.get(this.windowSelector).find(sel).type(mm, { force: true, delay: 100 });
    cy.get(this.windowSelector)
      .find(sel)
      .type(yyyy, { force: true, delay: 100 });
    cy.get(this.windowSelector).find(sel).type('{esc}', { force: true });
    return this;
  }

  /** Fill the "From" date (DD/MM/YYYY). */
  fillFromDate(dateFormatted: string): this {
    return this.fillDate('price-update-from-input', dateFormatted);
  }

  /** Fill the "Until" date (DD/MM/YYYY). */
  fillUntilDate(dateFormatted: string): this {
    return this.fillDate('price-update-until-input', dateFormatted);
  }

  // ── Buttons ───────────────────────────────────────────────────────────

  /** Click the "Preview" button. */
  clickPreview(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-btn"]')
      .click();
    return this;
  }

  /** Click the "Update (N)" / confirm button. */
  clickConfirm(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-confirm-btn"]')
      .click();
    return this;
  }

  /** Click the "Cancel" button. */
  clickCancel(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-cancel-btn"]')
      .click();
    return this;
  }

  // ── New price input ───────────────────────────────────────────────────

  /** Get the "New Price" input element. */
  getNewPriceInput(): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get(this.windowSelector)
      .find('[data-testid="price-update-new-price-input"]');
  }

  /** Fill the "New Price" field. */
  fillNewPrice(price: string): this {
    this.getNewPriceInput().clear();
    this.getNewPriceInput().type(price);
    return this;
  }

  /** Clear the "New Price" field. */
  clearNewPrice(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-new-price-input"]')
      .clear();
    return this;
  }

  // ── Alerts / summary ──────────────────────────────────────────────────

  /** Assert that the summary text is visible and contains the given text. */
  shouldHaveSummary(text: string, timeout = 30000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-summary-text"]', { timeout })
      .should('contain.text', text);
    return this;
  }

  /** Assert the "no sessions" message is shown. */
  shouldShowNoSessions(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-no-sessions-msg"]')
      .should('be.visible');
    return this;
  }

  // ── Preview table ─────────────────────────────────────────────────────

  /** Assert the preview table is visible. */
  shouldShowTable(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-table"]')
      .should('be.visible');
    return this;
  }

  /** Assert the preview table contains certain text. */
  tableShouldContain(text: string, timeout = 15000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-table"]', { timeout })
      .should('contain.text', text);
    return this;
  }

  /** Assert the preview table does NOT contain certain text. */
  tableShouldNotContain(text: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-table"]')
      .should('not.contain.text', text);
    return this;
  }

  // ── Confirm button state ──────────────────────────────────────────────

  /** Assert the confirm button is enabled. */
  shouldBeConfirmEnabled(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-confirm-btn"]')
      .should('not.be.disabled');
    return this;
  }

  /** Assert the confirm button is disabled. */
  shouldBeConfirmDisabled(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-confirm-btn"]')
      .should('be.disabled');
    return this;
  }

  /** Assert the confirm button shows the expected text. */
  confirmButtonShouldContain(text: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-confirm-btn"]')
      .should('contain.text', text);
    return this;
  }

  // ── Exclude checkbox (clicking a row's exclude checkbox) ──────────────

  /** Click the exclude checkbox on a row by its visible index (0-based). */
  toggleExcludeRow(rowIndex: number): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-table"]')
      .find('tbody tr')
      .eq(rowIndex)
      .find('input[type="checkbox"]')
      .click({ force: true });
    return this;
  }

  // ── From date clearing ─────────────────────────────────────────────────

  /**
   * Clear the "From" date field by clicking the dedicated clear button
   * (data-testid="price-update-from-clear").
   */
  clearFromDate(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-from-clear"]')
      .click({ force: true });
    return this;
  }

  // ── Warning alert ────────────────────────────────────────────────────

  /** Assert the price mismatch warning is visible and contains the given text. */
  shouldHaveMismatchWarning(text: string, timeout = 15000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-mismatch-warning"]', { timeout })
      .should('be.visible')
      .and('contain.text', text);
    return this;
  }

  /** Assert the price mismatch warning is NOT visible. */
  shouldNotHaveMismatchWarning(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-mismatch-warning"]')
      .should('not.exist');
    return this;
  }

  // ── New price assertions ──────────────────────────────────────────────

  /** Assert the new price input has a specific value. */
  shouldHaveNewPrice(price: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-new-price-input"]')
      .should('have.value', price);
    return this;
  }

  // ── Room column assertions ────────────────────────────────────────────

  /** Assert the preview table does NOT contain raw JSON like {"en":. */
  tableShouldNotContainRawJson(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="price-update-preview-table"]')
      .should('not.contain.text', '{"en":');
    return this;
  }
}
