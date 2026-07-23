/// <reference types="cypress" />

/**
 * Component Object for the Session Generate Preview dialog.
 *
 * The dialog opens inside the RPG window manager with
 * data-window-id="session-generate-preview".  All interactive
 * elements are addressed via data-testid attributes.
 *
 * The preview auto-fetches on open and whenever the date range changes,
 * so there is no explicit "Preview" button.
 */
export class SessionGenerateComponent {
  /** Selector for the window container. */
  private windowSelector = '[data-window-id="session-generate-preview"]';

  // ── Wait helpers ──────────────────────────────────────────────────────

  /** Wait until the window is visible in the DOM. */
  waitForWindow(timeout = 30000): this {
    cy.get(this.windowSelector, { timeout }).should('be.visible');
    return this;
  }

  /** Wait until the window has been removed from the DOM. */
  waitForWindowClose(timeout = 10000): this {
    cy.get(this.windowSelector, { timeout }).should('not.exist');
    return this;
  }

  /**
   * Wait for the session list to render with at least one row.
   * The preview auto-fetches on open; use this instead of the old clickPreview().
   */
  waitForSessionList(timeout = 30000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-preview-table"]', { timeout })
      .should('be.visible')
      .find('[data-testid="session-row"]', { timeout })
      .should('have.length.gte', 1);
    return this;
  }

  // ── Date range ────────────────────────────────────────────────────────

  /** Get the "From" input element. */
  getFromInput(): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get(this.windowSelector)
      .find('[data-testid="session-generate-from-input"]');
  }

  /** Get the "Until" input element. */
  getUntilInput(): Cypress.Chainable<JQuery<HTMLInputElement>> {
    return cy
      .get(this.windowSelector)
      .find('[data-testid="session-generate-until-input"]');
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
    return this.fillDate('session-generate-from-input', dateFormatted);
  }

  /** Fill the "Until" date (DD/MM/YYYY). */
  fillUntilDate(dateFormatted: string): this {
    return this.fillDate('session-generate-until-input', dateFormatted);
  }

  /** Open the quick-select menu on the Until field and pick a month option. */
  selectMonths(months: 1 | 2 | 3 | 6 | 12): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-quick-select-btn"]')
      .click();
    cy.get('.MuiMenu-list').contains(`${months} month`).click();
    return this;
  }

  // ── Buttons ───────────────────────────────────────────────────────────

  /**
   * @deprecated Preview is now automatic on open and date change.
   * Use waitForSessionList() instead.
   */
  clickPreview(): this {
    return this.waitForSessionList();
  }

  /** Click the "Last session" shortcut button (HistoryIcon inside From input). */
  clickLastSession(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-last-session-btn"]')
      .click();
    return this;
  }

  /** Click the "Generate (N)" / confirm button. */
  clickConfirm(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-confirm-btn"]')
      .click();
    return this;
  }

  /** Click the "Cancel" button. */
  clickCancel(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-cancel-btn"]')
      .click();
    return this;
  }

  // ── Alerts / summary ──────────────────────────────────────────────────

  /** Assert that the summary text is visible and contains the given text. */
  shouldHaveSummary(text: string, timeout = 30000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-summary-text"]', { timeout })
      .should('contain.text', text);
    return this;
  }

  /** Assert the "no sessions" message is shown. */
  shouldShowNoSessions(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-no-sessions-msg"]')
      .should('be.visible');
    return this;
  }

  /** Assert the duplicate alert is visible and optionally contains text. */
  shouldHaveDuplicateAlert(text?: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-duplicate-alert"]')
      .should('be.visible');
    if (text) {
      cy.get(this.windowSelector)
        .find('[data-testid="session-generate-duplicate-alert"]')
        .should('contain.text', text);
    }
    return this;
  }

  /** Assert there is NO duplicate alert. */
  shouldNotHaveDuplicateAlert(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-duplicate-alert"]')
      .should('not.exist');
    return this;
  }

  /** Assert the clash alert is visible and optionally contains text. */
  shouldHaveClashAlert(text?: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-clash-alert"]')
      .should('be.visible');
    if (text) {
      cy.get(this.windowSelector)
        .find('[data-testid="session-generate-clash-alert"]')
        .should('contain.text', text);
    }
    return this;
  }

  /** Assert there is NO clash alert. */
  shouldNotHaveClashAlert(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-clash-alert"]')
      .should('not.exist');
    return this;
  }

  // ── Session list ──────────────────────────────────────────────────────

  /** Assert the session list is visible. */
  shouldShowTable(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-preview-table"]')
      .should('be.visible');
    return this;
  }

  /** Assert the session list contains certain text. */
  tableShouldContain(text: string, timeout = 15000): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-preview-table"]', { timeout })
      .should('contain.text', text);
    return this;
  }

  // ── Confirm button state ──────────────────────────────────────────────

  /** Assert the confirm button is enabled. */
  shouldBeConfirmEnabled(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-confirm-btn"]')
      .should('not.be.disabled');
    return this;
  }

  /** Assert the confirm button is disabled. */
  shouldBeConfirmDisabled(): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-confirm-btn"]')
      .should('be.disabled');
    return this;
  }

  /** Assert the confirm button shows the expected text. */
  confirmButtonShouldContain(text: string): this {
    cy.get(this.windowSelector)
      .find('[data-testid="session-generate-confirm-btn"]')
      .should('contain.text', text);
    return this;
  }
}
