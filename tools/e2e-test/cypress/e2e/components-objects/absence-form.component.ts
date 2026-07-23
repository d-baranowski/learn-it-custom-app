/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

// The "Saved" toast is dispatched by the form only after the create mutation
// resolves, so it (not the dialog closing) is the true creation signal.
const savedToastSelector = '[role="status"]:contains("Saved")';
const MAX_SAVE_ATTEMPTS = 3;
const SAVE_OUTCOME_WINDOW_MS = 8000;
const SAVE_POLL_MS = 300;

/**
 * Component Object for the Absence form
 * Encapsulates all interactions with the create/edit absence dialog
 *
 * Form fields:
 *   - Therapist (autocomplete, data-testid="therapist-id", optional — empty = org-wide)
 *   - From Date/Time (datetime picker, data-testid="from-time")
 *   - Till Date/Time (datetime picker, data-testid="till-time")
 *   - Reason (textarea, data-testid="reason")
 */
export class AbsenceFormComponent {
  readonly selectors = {
    addItemButton: '[data-testid="create-item-btn"]',
    submitButton: '[data-testid="form-submit-btn"]',
    cancelButton: '[data-testid="form-cancel-btn"]',
    formWrapper: '[data-testid="tabular-form-wrapper"]',
    formDialog: '[data-testid="dialog2-container"]',
    therapistId: 'input[data-testid="therapist-id"]',
    fromTime: 'input[data-testid="from-time"]',
    tillTime: 'input[data-testid="till-time"]',
    reason: 'textarea[data-testid="reason"]',
    option: '[role="option"]',
  };

  /** Click the New button to open the create form */
  clickAddItem(): this {

    cylog('Absence: clickAddItem');
    cy.get(this.selectors.addItemButton).click();
    return this;
  }

  /** Wait for the form dialog and fields to be ready */
  waitForFormLoad(): this {
    cy.get(this.selectors.formDialog, { timeout: 15000 }).should('exist');
    cy.get(this.selectors.fromTime, { timeout: 15000 }).should('exist');
    return this;
  }

  /** Wait for the form to close */
  waitForFormClose(timeout: number = 10000): this {
    closeWindowIfOpen();
    cy.get(this.selectors.formDialog, { timeout }).should('not.exist');
    return this;
  }

  /** Wait for an opened edit form to be populated with the loaded entity */
  waitForFormPopulated(): this {
    cy.get(this.selectors.formDialog).should('exist');
    cy.get(this.selectors.fromTime).should('not.have.value', '');
    return this;
  }

  /**
   * Full create chain: open the form, fill the fields, save and wait for
   * the form to close. Omit `therapistName` for an org-wide absence.
   */
  createAbsence(options: {
    therapistName?: string;
    fromTime: string;
    tillTime: string;
    reason: string;
  }): this {
    cy.get(this.selectors.formDialog).should('not.exist');
    this.clickAddItem();
    this.waitForFormLoad();
    if (options.therapistName) {
      this.selectTherapist(options.therapistName);
    }
    this.fillFromTime(options.fromTime);
    this.fillTillTime(options.tillTime);
    this.fillReason(options.reason);
    this.shouldBeSubmitEnabled();
    this.saveWithRetry();
    return this.waitForFormClose();
  }

  /**
   * Click Save and confirm the create actually happened, retrying the click.
   * A Save landing before the form finishes wiring is silently dropped, and a
   * trailing assertion would only retry itself — never the click. Re-submit
   * until the "Saved" toast appears (or the dialog closes, which the form only
   * does on a successful submit).
   */
  private saveWithRetry(): void {
    cylog('Absence: saving with retry');
    cy.get(this.selectors.submitButton).click();
    this.expectSaved(1, SAVE_OUTCOME_WINDOW_MS);
  }

  private expectSaved(attempt: number, remainingMs: number): void {
    cy.get('body').then(($body) => {
      const saved = $body.find(savedToastSelector).length > 0;
      const formClosed = $body.find(this.selectors.formDialog).length === 0;
      if (saved || formClosed) {
        cylog(`Absence: create confirmed via ${saved ? '"Saved" toast' : 'form close'}`);
        return;
      }

      if (remainingMs <= 0) {
        if (attempt >= MAX_SAVE_ATTEMPTS) {
          throw new Error(
            `Absence: create not confirmed after ${attempt} save attempts — ` +
              'no "Saved" toast and the form is still open (save not registering)'
          );
        }
        cylog(`Absence: save attempt ${attempt} stalled, re-clicking Save...`);
        cy.get(this.selectors.submitButton).click();
        this.expectSaved(attempt + 1, SAVE_OUTCOME_WINDOW_MS);
        return;
      }

      // Bounded state poll — each tick re-inspects the DOM for the two terminal
      // states above rather than sleeping a fixed amount.
      // eslint-disable-next-line cypress/no-unnecessary-waiting -- bounded poll interval between DOM state checks
      cy.wait(SAVE_POLL_MS);
      this.expectSaved(attempt, remainingMs - SAVE_POLL_MS);
    });
  }

  /** Assert the MUI form control wrapping a field renders the given label */
  shouldHaveFieldLabel(
    field: 'fromTime' | 'tillTime' | 'reason',
    label: string
  ): this {
    cy.get(this.selectors[field])
      .parents('.MuiFormControl-root')
      .first()
      .should('contain.text', label);
    return this;
  }

  /**
   * Select a therapist from the Therapist dropdown
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
   * Fill the From Date/Time field using native setter + type
   */
  fillFromTime(dateTime: string): this {
    this.clearAndType(this.selectors.fromTime, dateTime);
    return this;
  }

  /**
   * Fill the Till Date/Time field using native setter + type
   */
  fillTillTime(dateTime: string): this {
    this.clearAndType(this.selectors.tillTime, dateTime);
    return this;
  }

  /**
   * Fill the Reason textarea
   */
  fillReason(reason: string): this {
    cy.get(this.selectors.reason).clear();
    cy.get(this.selectors.reason).type(reason);
    return this;
  }

  /** Click the Save button */
  clickSave(): this {

    cylog('Absence: clickSave');
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  /** Click the Cancel button */
  clickCancel(): this {
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  /** Verify the Save button is disabled */
  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.submitButton).should('be.disabled');
    return this;
  }

  /** Verify the Save button is enabled */
  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.submitButton, { timeout: 10000 }).should('not.be.disabled');
    return this;
  }

  /**
   * Clear a React-controlled input and type new value.
   * Uses native setter to clear, waits for React to process, then types.
   */
  private clearAndType(selector: string, value: string): void {
    cy.get(selector).then(($input) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeSetter.call($input[0], '');
      $input[0].dispatchEvent(new Event('input', { bubbles: true }));
      $input[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    cy.get(selector).should('have.value', '');
    cy.get(selector).type(value);
  }
}
