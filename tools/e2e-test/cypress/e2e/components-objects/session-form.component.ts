/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { AutocompleteComponent } from './autocomplete.component';
import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for Session Form (create/edit)
 *
 * Fields use plain string inputs (StringFe) with data-testids:
 *   - session-date       (text input, YYYY-MM-DD)
 *   - session-start-time (text input, HH:mm)
 *   - session-end-time   (text input, HH:mm)
 *   - session-timezone   (text input, IANA timezone)
 *   - therapy-id         (autocomplete combobox)
 *   - therapist-id       (autocomplete combobox)
 *   - room-id            (autocomplete combobox)
 *   - price              (text input)
 *   - customer-ids       (autocomplete combobox)
 */
export class SessionFormComponent {
  private readonly autocomplete = new AutocompleteComponent();

  readonly selectors = {
    newButton: '[data-testid="create-item-btn"]',
    submitButton: '[data-testid="form-submit-btn"]',
    cancelButton: '[data-testid="form-cancel-btn"]',
    therapyInput: 'input[data-testid="therapy-id"]',
    therapistInput: 'input[data-testid="therapist-id"]',
    roomInput: 'input[data-testid="room-id"]',
    priceInput: 'input[data-testid="price"]',
    customerInput: 'input[data-testid="customer-ids"]',
    dateInput: 'input[data-testid="session-date"]',
    startTimeInput: 'input[data-testid="session-start-time"]',
    endTimeInput: 'input[data-testid="session-end-time"]',
    timezoneInput: 'input[data-testid="session-timezone"]',
    displayNameInput: 'input[data-testid="session-display-name"]',
  };

  fillDisplayName(value: string): this {
    this.clearAndType(this.selectors.displayNameInput, value);
    return this;
  }

  clickNew(): this {


    cylog('Session: clickNew');
    cy.get(this.selectors.newButton).click();
    return this;
  }

  submit(): this {


    cylog('Session: submit');
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  cancel(): this {


    cylog('Session: cancel');
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  // ── Session-form scope helpers ─────────────────────────────────────────────
  // These target the session form by its `data-form-entity="session"` root,
  // which is what distinguishes a nested SessionForm from the surrounding
  // TherapyForm when both are mounted (e.g. editing a session from the
  // Sessions tab inside a therapy).

  private readonly scope = '[data-form-entity="session"]';

  /** Wait for the session form to mount inside the current dialog. */
  waitForOpen(timeout: number = 15000): this {
    cy.get(this.scope, { timeout }).should('exist');
    return this;
  }

  /** Wait for the session form to unmount (after a successful save / cancel). */
  waitForClose(timeout: number = 15000): this {
    // Find the dialog containing this form and click its close button specifically
    cy.get(this.scope, { timeout }).then(($form) => {
      if ($form.length > 0) {
        // Get the closest dialog container
        const $dialog = $form.closest('[data-testid="dialog2-container"]');
        if ($dialog.length > 0) {
          // Find and click the close button within this specific dialog
          const $closeBtn = $dialog.find('[data-testid="window-close-btn"]');
          if ($closeBtn.length > 0) {
            ($closeBtn[0] as HTMLElement).click();
          }
        }
      }
    });
    cy.get(this.scope, { timeout }).should('not.exist');
    return this;
  }

  /**
   * Assert the session has loaded into the form (price is server-populated,
   * so a non-empty value is a cheap way to distinguish EDIT mode from the
   * empty CREATE form).
   */
  shouldBeLoaded(): this {
    cy.get(`${this.scope} ${this.selectors.priceInput}`)
      .invoke('val')
      .should('not.be.empty');
    return this;
  }

  /** Click the session form's Save button (scoped). */
  clickSave(): this {

    cylog('Session: clickSave');
    cy.get(`${this.scope} ${this.selectors.submitButton}`).click();
    return this;
  }

  /**
   * Assert the session form's Save button is in the visible "saving…" state
   * (LoadingButton spinner, `data-saving="true"`). Use to verify optimistic
   * grid updates without listening to the network.
   */
  assertSaving(timeout: number = 5000): this {
    cy.get(`${this.scope} ${this.selectors.submitButton}`, { timeout }).should(
      'have.attr',
      'data-saving',
      'true'
    );
    return this;
  }

  /** Assert the Save button has returned to idle (mutation resolved). */
  assertNotSaving(timeout: number = 15000): this {
    cy.get(`${this.scope} ${this.selectors.submitButton}`, { timeout }).should(
      'have.attr',
      'data-saving',
      'false'
    );
    return this;
  }

  selectTherapy(therapyText: string): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapyInput);
    cy.get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .contains(therapyText)
      .click();
    return this;
  }

  selectTherapist(therapistText: string): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapistInput);
    cy.get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .contains(therapistText)
      .click();
    return this;
  }

  /**
   * Select the current logged-in user as therapist using the "Select Myself"
   * shortcut button. More robust than going through the autocomplete dropdown.
   */
  selectMyselfAsTherapist(): this {
    this.dismissDropdown();
    cy.get('[data-testid="select-myself-therapist-btn"]').click();
    cy.get(this.selectors.therapistInput).should('not.have.value', '');
    return this;
  }

  /** Assert the Therapist field is prefilled (e.g. from a therapist-calendar slot's column). */
  shouldHaveTherapistPrefilled(): this {
    cy.get(`${this.scope} ${this.selectors.therapistInput}`, { timeout: 15000 })
      .invoke('val')
      .should('not.be.empty');
    return this;
  }

  /** Assert the Room field is prefilled (e.g. from a room-calendar slot's column). */
  shouldHaveRoomPrefilled(): this {
    cy.get(`${this.scope} ${this.selectors.roomInput}`, { timeout: 15000 })
      .invoke('val')
      .should('not.be.empty');
    return this;
  }

  selectRoom(roomText: string): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.roomInput);
    cy.get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .contains(roomText)
      .click();
    return this;
  }

  selectCustomers(customerTexts: string[]): this {
    this.dismissDropdown();
    cy.get(this.selectors.customerInput).click();
    cy.get('body').then(($body) => {
      if ($body.find('.MuiAutocomplete-loading').length > 0) {
        cy.get('.MuiAutocomplete-loading', { timeout: 30000 }).should('not.exist');
      }
    });
    customerTexts.forEach((text) => {
      cy.get('[role="option"]', { timeout: 30000 })
        .should('be.visible')
        .contains(text)
        .click();
    });
    this.dismissDropdown();
    customerTexts.forEach((text) => {
      cy.get('.MuiChip-label', { timeout: 5000 }).contains(text).should('exist');
    });
    return this;
  }

  /**
   * Fill the Date field via the MUI sectioned date picker.
   * Accepts DD/MM/YYYY (display format). The underlying input is a
   * DatePickerElement whose sections (DD, MM, YYYY) are independently
   * focusable — raw typing does not work; we navigate to the DD section
   * and type digits, letting MUI auto-advance.
   * @param dateValue - Date in DD/MM/YYYY format
   */
  fillDate(dateValue: string): this {
    const [dd, mm, yyyy] = dateValue.split('/');
    const sel = this.selectors.dateInput;
    cy.get(sel).click({ force: true });
    // Jump to the leftmost (DD) section, then type each piece; MUI auto-advances.
    cy.get(sel).type(
      '{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}',
      { force: true },
    );
    cy.get(sel).type(dd, { force: true, delay: 100 });
    cy.get(sel).type(mm, { force: true, delay: 100 });
    cy.get(sel).type(yyyy, { force: true, delay: 100 });
    // Close any calendar popover that may have opened.
    cy.get(sel).type('{esc}', { force: true });
    return this;
  }

  /**
   * Fill a MUI sectioned time picker (HH:mm). Navigates to the HH section,
   * then types HH and MM, letting MUI auto-advance.
   */
  private fillSectionedTime(sel: string, timeValue: string): void {
    const [hh, mm] = timeValue.split(':');
    cy.get(sel).click({ force: true });
    // Two sections (HH, MM) — jump to the leftmost.
    cy.get(sel).type('{leftArrow}{leftArrow}', { force: true });
    cy.get(sel).type(hh, { force: true, delay: 100 });
    cy.get(sel).type(mm, { force: true, delay: 100 });
    // Dismiss any clock popover that may have opened.
    cy.get(sel).type('{esc}', { force: true });
  }

  /**
   * Fill the Start Time field (HH:mm format).
   * @param timeValue - Time in HH:mm format
   */
  fillStartTime(timeValue: string): this {
    this.fillSectionedTime(this.selectors.startTimeInput, timeValue);
    return this;
  }

  /**
   * Fill the End Time field (HH:mm format).
   * @param timeValue - Time in HH:mm format
   */
  fillEndTime(timeValue: string): this {
    this.fillSectionedTime(this.selectors.endTimeInput, timeValue);
    return this;
  }

  /**
   * Fill start datetime — convenience wrapper matching legacy API.
   * @param dateValue - Date in DD/MM/YYYY format
   * @param timeValue - Time in HH:mm format
   */
  fillStartDateTime(dateValue: string, timeValue: string): this {
    this.fillDate(dateValue);
    this.fillStartTime(timeValue);
    return this;
  }

  /**
   * Fill end datetime — convenience wrapper matching legacy API.
   * @param dateValue - Date in DD/MM/YYYY format (ignored — date already set)
   * @param timeValue - Time in HH:mm format
   */
  fillEndDateTime(_dateValue: string, timeValue: string): this {
    this.fillEndTime(timeValue);
    return this;
  }

  fillPrice(price: string): this {
    this.clearAndType(this.selectors.priceInput, price);
    return this;
  }

  shouldHaveDropdownValue(labelText: string, expectedText: string): this {
    const selectorMap: Record<string, string> = {
      Room: this.selectors.roomInput,
      Therapist: this.selectors.therapistInput,
      Therapy: this.selectors.therapyInput,
    };
    const selector = selectorMap[labelText];
    if (selector) {
      cy.get(selector).invoke('val').should('contain', expectedText);
    } else {
      cy.contains('label', new RegExp(labelText, 'i'))
        .parent()
        .find('input')
        .first()
        .invoke('val')
        .should('contain', expectedText);
    }
    return this;
  }

  shouldHaveFieldValue(labelText: string, expectedValue: string): this {
    const selectorMap: Record<string, string> = {
      Price: this.selectors.priceInput,
    };
    const selector = selectorMap[labelText];
    if (selector) {
      cy.get(selector).should('have.value', expectedValue);
    } else {
      cy.contains('label', new RegExp(labelText, 'i'))
        .parent()
        .find('input')
        .first()
        .should('have.value', expectedValue);
    }
    return this;
  }

  shouldNotHaveNewButton(): this {
    cy.get(this.selectors.newButton).should('not.exist');
    return this;
  }

  /**
   * Verify a field has a validation error (Mui-error on the closest MuiFormControl-root).
   * @param dataTestId - The data-testid of the field input
   */
  shouldHaveFieldError(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`)
      .closest('.MuiFormControl-root')
      .find('.Mui-error')
      .should('exist');
    return this;
  }

  /**
   * Verify a field does NOT have a validation error.
   * @param dataTestId - The data-testid of the field input
   */
  shouldNotHaveFieldError(dataTestId: string): this {
    cy.get(`input[data-testid="${dataTestId}"]`)
      .closest('.MuiFormControl-root')
      .find('.Mui-error')
      .should('not.exist');
    return this;
  }

  /**
   * Check whether the submit button is disabled.
   */
  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.submitButton, { timeout: 10000 }).should(
      'be.disabled'
    );
    return this;
  }

  /**
   * Check whether the submit button is enabled.
   */
  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.submitButton).should('not.be.disabled');
    return this;
  }

  /**
   * Get the available options in a dropdown by data-testid.
   * Opens the dropdown, collects option texts, leaves dropdown open for caller
   * to either select or dismiss.
   */
  getDropdownOptions(dataTestId: string): Cypress.Chainable<string[]> {
    this.dismissDropdown();
    this.openAutocomplete(`input[data-testid="${dataTestId}"]`);
    return cy
      .get('[role="option"]', { timeout: 30000 })
      .should('be.visible')
      .then(($options) => {
        const texts = Cypress._.map(
          $options,
          (el) => el.textContent?.trim() || ''
        );
        return texts;
      });
  }

  /**
   * Assert that a dropdown has no options (shows "No options" text).
   */
  shouldHaveNoDropdownOptions(dataTestId: string): this {
    this.dismissDropdown();
    cy.get(`input[data-testid="${dataTestId}"]`).click();
    cy.get('.MuiAutocomplete-noOptions', { timeout: 10000 }).should(
      'be.visible'
    );
    this.dismissDropdown();
    return this;
  }

  /** Click the "Find available room" button inside the Room field. */
  clickFindAvailableRoom(): this {
    cy.get('[data-testid="find-available-room-btn"]').click();
    return this;
  }

  /** Assert the "Find available room" button is disabled. */
  shouldFindAvailableRoomBeDisabled(): this {
    cy.get('[data-testid="find-available-room-btn"]').should('be.disabled');
    return this;
  }

  /** Assert the "Find available room" button is enabled. */
  shouldFindAvailableRoomBeEnabled(): this {
    cy.get('[data-testid="find-available-room-btn"]').should('not.be.disabled');
    return this;
  }

  // ── Payment tab ────────────────────────────────────────────────────────────

  openPaymentTab(): this {
    cy.get('[data-testid="tab-payment"]').click();
    return this;
  }

  /** Click "Create Payment Link". Only present when no link exists yet (edit mode). */
  clickCreatePaymentLink(): this {
    cy.get('[data-testid="create-payment-link"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="create-payment-link"]').click();
    return this;
  }

  /** Wait for payment-status chip to contain PENDING or READY after creation or refresh. */
  waitForPaymentStatus(): this {
    cy.get('[data-testid="payment-status"]', { timeout: 15000 })
      .invoke('text')
      .should('match', /PENDING|READY/);
    return this;
  }

  shouldNotHaveCreatePaymentLinkButton(): this {
    cy.get('[data-testid="create-payment-link"]').should('not.exist');
    return this;
  }

  shouldHaveRefreshPaymentLinkButton(): this {
    cy.get('[data-testid="refresh-payment-link-btn"]').should('be.visible');
    return this;
  }

  shouldHavePaymentLink(): this {
    cy.get('[data-testid="payment-link"]').should('exist');
    return this;
  }

  shouldHaveCopyPaymentLinkButton(): this {
    cy.get('[data-testid="copy-payment-link-btn"]').should('be.visible');
    return this;
  }

  shouldHaveOpenPaymentLinkButton(): this {
    cy.get('[data-testid="open-payment-link-btn"]').should('be.visible');
    return this;
  }

  clickRefreshPaymentLink(): this {
    cy.get('[data-testid="refresh-payment-link-btn"]').click();
    cy.get('[data-testid="refresh-payment-link-btn"]', { timeout: 10000 }).should('not.be.disabled');
    return this;
  }

  clickCopyPaymentLink(): this {
    cy.get('[data-testid="copy-payment-link-btn"]').click();
    return this;
  }

  getPaymentLinkUrl(): Cypress.Chainable<string> {
    return cy.get('[data-testid="payment-link"]').invoke('val') as Cypress.Chainable<string>;
  }

  /**
   * Poll the refresh button up to maxAttempts times until the payment link URL
   * is populated. Stops early once a non-empty URL is returned.
   */
  refreshUntilLinkReady(maxAttempts: number = 3): this {
    const tryRefresh = (attemptsLeft: number) => {
      if (attemptsLeft <= 0) return;
      this.clickRefreshPaymentLink();
      cy.get('[data-testid="payment-link"]').invoke('val').then((val) => {
        if (!val && attemptsLeft > 1) {
          tryRefresh(attemptsLeft - 1);
        }
      });
    };
    tryRefresh(maxAttempts);
    return this;
  }

  // ── Form lifecycle ──────────────────────────────────────────────────────────

  waitForFormLoad(): this {
    cy.get(this.selectors.dateInput, { timeout: 10000 }).should('exist');
    return this;
  }

  /**
   * Wait for the form dialog to fully close after submission.
   * Checks that the date input (unique to the session form dialog) is gone.
   */
  waitForFormClose(): this {
    closeWindowIfOpen();
    cy.get(this.selectors.dateInput, { timeout: 15000 }).should('not.exist');
    return this;
  }

  /**
   * Convert DD/MM/YYYY to YYYY-MM-DD.
   */
  private ddmmyyyyToIso(ddmmyyyy: string): string {
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Clear a React-controlled input and type new value.
   * Uses {selectall} to select existing text, then typing replaces it.
   * This ensures react-hook-form's useController onChange fires properly
   * through React's synthetic event system.
   */
  private clearAndType(selector: string, value: string): void {
    // Scope to this form and take the first match: during a MUI dialog
    // open/close transition two session forms can momentarily coexist, and an
    // unscoped `cy.get(input).focus()` then errors with "contained 2 elements".
    const scoped = `${this.scope} ${selector}`;
    cy.get(scoped).first().focus();
    cy.get(scoped).first().type('{selectall}', { force: true });
    cy.get(scoped).first().type(value, { force: true });
  }

  /**
   * Open a MUI Autocomplete listbox robustly.
   * Keyboard-only (focus + ArrowDown via real cy.type) — clicks are
   * unreliable because MUI Autocomplete defaults to openOnFocus=false.
   * Recursive retry so a race-lost first attempt doesn't strand the test.
   */
  // Scope to this form so a transient second session dialog can't make the
  // shared driver's `focus()` see two inputs; it takes `.first()` from there.
  private openAutocomplete(inputSelector: string): void {
    this.autocomplete.open(`${this.scope} ${inputSelector}`);
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
