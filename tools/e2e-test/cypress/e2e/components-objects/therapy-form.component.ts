/// <reference types="cypress" />

import { AutocompleteComponent } from './autocomplete.component';
import { closeWindowIfOpen } from './form.component';

export class TherapyFormComponent {
  private readonly autocomplete = new AutocompleteComponent();

  readonly selectors = {
    newButton: '[data-testid="create-item-btn"]',
    submitButton: '[data-testid="form-submit-btn"]',
    cancelButton: '[data-testid="form-cancel-btn"]',
    formWrapper: '[data-testid="tabular-form-wrapper"]',

    configurationTab: '[data-testid="tab-configuration"]',
    sessionFrequencyTab: '[data-testid="tab-schedule"]',

    displayNameInput: 'input[data-testid="display-name"]',
    therapistInput: 'input[data-testid="therapist-id"]',
    serviceInput: 'input[data-testid="service-id"]',
    customerInput: 'input[data-testid="customer-ids"]',

    startDateInput: 'input[data-testid="start-date"]',
    endDateInput: 'input[data-testid="end-date"]',
    sessionDurationInput: 'input[data-testid="session-duration"]',
    sessionPriceInput: 'input[data-testid="session-price"]',

    sessionFrequencyContainer: '[data-testid="session-frequency"]',
    addScheduleButton: '[data-testid="session-frequency-add-schedule"]',
    generateSessionsButton: '[data-testid="generate-sessions-btn"]',
    selectMyselfButton: '[data-testid="select-myself-therapist-btn"]',
    suggestDisplayNameButton: '[data-testid="suggest-display-name-btn"]',
    postCreateGenerateLaterButton: '[data-testid="post-create-generate-later-btn"]',
    postCreateGenerateYesButton: '[data-testid="post-create-generate-yes-btn"]',
    windowCloseButton: '[data-testid="window-close-btn"]',

    option: '[role="option"]',
    autocompletePopper: '.MuiAutocomplete-popper',
    errorBadge: '.MuiBadge-colorError',
    errorClass: '.Mui-error',
    formControl: '.MuiFormControl-root',
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────

  clickNew(): this {
    cy.get(this.selectors.newButton).click();
    return this;
  }

  clickSave(): this {
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  submit(): this {
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  waitForCreateSaved(timeout: number = 15000): this {
    // The Sessions tab only renders once the created therapy has an id and
    // the post-create edit-mode form settled — the visible "create saved" signal.
    cy.contains('button[tab]', /^Sessions$/, { timeout }).should('be.visible');
    return this;
  }

  submitCreateAndClose(): this {
    this.submit();
    this.waitForCreateSaved();
    this.closeWindow();
    this.waitForFormClose();
    return this;
  }

  cancel(): this {
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.displayNameInput).should('exist');
    return this;
  }

  waitForFormClose(timeout: number = 10000): this {
    closeWindowIfOpen();
    cy.get(this.selectors.formWrapper, { timeout }).should('not.exist');
    return this;
  }

  closeWindow(): this {
    cy.get(this.selectors.windowCloseButton).click();
    return this;
  }

  closeWindowIfOpen(): this {
    closeWindowIfOpen();
    return this;
  }

  // ── Saving state ────────────────────────────────────────────────────────

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

  // ── Tab navigation ──────────────────────────────────────────────────────

  goToConfigurationTab(): this {
    cy.get(this.selectors.configurationTab).scrollIntoView();
    cy.get(this.selectors.configurationTab).click({ force: true });
    return this;
  }

  goToSessionFrequencyTab(): this {
    cy.get(this.selectors.sessionFrequencyTab).scrollIntoView();
    cy.get(this.selectors.sessionFrequencyTab).click({ force: true });
    return this;
  }

  goToSessionsTab(): this {
    cy.get('button[tab]').contains(/^Sessions$/).scrollIntoView();
    cy.get('button[tab]').contains(/^Sessions$/).click({ force: true });
    return this;
  }

  // ── Basic Information fields ────────────────────────────────────────────

  fillDisplayName(value: string, clear = true): this {
    if (clear) {
      cy.get(this.selectors.displayNameInput).clear();
      if (value !== '') {
        cy.get(this.selectors.displayNameInput).type(value);
      }
    } else {
      cy.get(this.selectors.displayNameInput).type(value);
    }
    return this;
  }

  selectTherapist(name: string): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapistInput);
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).contains(name).click();
    return this;
  }

  selectFirstTherapist(): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapistInput);
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).first().click();
    return this;
  }

  selectService(name: string): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.serviceInput);
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).contains(name).click();
    return this;
  }

  selectFirstService(): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.serviceInput);
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).first().click();
    return this;
  }

  selectCustomers(names: string[], closeAfter = true): this {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.customerInput);
    names.forEach((name) => {
      cy.get(this.selectors.option, { timeout: 30000 })
        .should('be.visible')
        .contains(name)
        .click();
    });
    if (closeAfter) {
      this.dismissDropdown();
    }
    return this;
  }

  clickSelectMyself(): this {
    cy.get(this.selectors.selectMyselfButton).click();
    return this;
  }

  clickSuggestDisplayName(): this {
    cy.get(this.selectors.suggestDisplayNameButton).click();
    return this;
  }

  // ── Schedule & Pricing fields ───────────────────────────────────────────

  fillStartDate(value: string): this {
    cy.get(this.selectors.startDateInput).clear();
    if (value !== '') {
      cy.get(this.selectors.startDateInput).type(value);
    }
    return this;
  }

  fillEndDate(value: string): this {
    cy.get(this.selectors.endDateInput).clear();
    if (value !== '') {
      cy.get(this.selectors.endDateInput).type(value);
    }
    return this;
  }

  fillSessionDuration(value: string | number): this {
    cy.get(this.selectors.sessionDurationInput).clear();
    const v = String(value);
    if (v !== '') {
      cy.get(this.selectors.sessionDurationInput).type(v);
    }
    return this;
  }

  fillSessionPrice(value: string | number): this {
    cy.get(this.selectors.sessionPriceInput).clear();
    const v = String(value);
    if (v !== '') {
      cy.get(this.selectors.sessionPriceInput).type(v);
    }
    return this;
  }

  clearSessionDuration(): this {
    cy.get(this.selectors.sessionDurationInput).clear();
    return this;
  }

  clearSessionPrice(): this {
    cy.get(this.selectors.sessionPriceInput).clear();
    return this;
  }

  clearEndDate(): this {
    cy.get(this.selectors.endDateInput).clear();
    return this;
  }

  // ── Session Frequency fields ────────────────────────────────────────────

  clickAddSchedule(): this {
    cy.get(this.selectors.addScheduleButton).click();
    return this;
  }

  selectFrequencyRoom(name: string): this {
    this.dismissDropdown();
    this.openAutocomplete(
      `${this.selectors.sessionFrequencyContainer} input[name="sessionFrequency.0.roomId"]`
    );
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).contains(name).click();
    return this;
  }

  selectFirstFrequencyRoom(): this {
    this.dismissDropdown();
    this.openAutocomplete(
      `${this.selectors.sessionFrequencyContainer} input[name="sessionFrequency.0.roomId"]`
    );
    cy.get(this.selectors.option, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.option).first().click();
    return this;
  }

  selectFrequencyUnit(value: string): this {
    this.dismissDropdown();
    cy.get('[data-testid="frequency-unit-0"]').click();
    cy.get('[role="listbox"] [role="option"]', { timeout: 25000 }).should('be.visible');
    cy.get('[role="listbox"] [role="option"]').contains(value, { matchCase: false }).click();
    return this;
  }

  toggleFrequencyDay(narrowLabel: string): this {
    cy.get(this.selectors.sessionFrequencyContainer)
      .contains('button', narrowLabel, { matchCase: false })
      .click();
    return this;
  }

  setFrequencyOnline(): this {
    cy.get(this.selectors.sessionFrequencyContainer)
      .contains('button', 'Online')
      .click();
    return this;
  }

  setFrequencyStartTime(time: string): this {
    cy.get(this.selectors.sessionFrequencyContainer)
      .find('input[type="time"]')
      .clear({ force: true });
    cy.get(this.selectors.sessionFrequencyContainer)
      .find('input[type="time"]')
      .type(time, { force: true });
    return this;
  }

  clickGenerateSessions(): this {
    cy.get(this.selectors.generateSessionsButton).click();
    return this;
  }

  clickUpdateSessionPricesBtn(): this {
    cy.get('[data-testid="update-session-prices-btn"]').click();
    return this;
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  getDisplayName(): Cypress.Chainable<string> {
    return cy.get(this.selectors.displayNameInput).invoke('val');
  }

  getTherapist(): Cypress.Chainable<string> {
    return cy.get(this.selectors.therapistInput).invoke('val');
  }

  getSessionDuration(): Cypress.Chainable<string> {
    return cy.get(this.selectors.sessionDurationInput).invoke('val');
  }

  getSessionPrice(): Cypress.Chainable<string> {
    return cy.get(this.selectors.sessionPriceInput).invoke('val');
  }

  getStartDate(): Cypress.Chainable<string> {
    return cy.get(this.selectors.startDateInput).invoke('val');
  }

  getEndDate(): Cypress.Chainable<string> {
    return cy.get(this.selectors.endDateInput).invoke('val');
  }

  getFrequencyRoom(): Cypress.Chainable<string> {
    return cy
      .get(this.selectors.sessionFrequencyContainer)
      .find('input[name="sessionFrequency.0.roomId"]')
      .invoke('val');
  }

  getFrequencyEvery(): Cypress.Chainable<string> {
    return cy
      .get('[data-testid="frequency-every-0"]')
      .find('input[type="number"]')
      .invoke('val');
  }

  getFrequencyUnit(): Cypress.Chainable<string> {
    return cy
      .get('[data-testid="frequency-unit-0"]')
      .invoke('text')
      .then((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }

  getFrequencyStartTime(): Cypress.Chainable<string> {
    return cy
      .get(this.selectors.sessionFrequencyContainer)
      .find('input[type="time"]')
      .invoke('val');
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  shouldHaveDisplayName(expected: string): this {
    cy.get(this.selectors.displayNameInput).should('have.value', expected);
    return this;
  }

  shouldHaveSessionDuration(expected: string): this {
    cy.get(this.selectors.sessionDurationInput).should('have.value', expected);
    return this;
  }

  shouldHaveSessionPrice(expected: string): this {
    cy.get(this.selectors.sessionPriceInput).should('have.value', expected);
    return this;
  }

  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.submitButton, { timeout: 10000 }).should('be.disabled');
    return this;
  }

  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.submitButton).should('not.be.disabled');
    return this;
  }

  shouldHaveErrorBadge(): this {
    cy.get(this.selectors.errorBadge).should('exist');
    return this;
  }

  // ── Field error assertions ──────────────────────────────────────────────

  shouldHaveDisplayNameError(): this {
    this.assertFieldError(this.selectors.displayNameInput);
    return this;
  }

  shouldHaveTherapistError(): this {
    this.assertFieldError(this.selectors.therapistInput);
    return this;
  }

  shouldHaveServiceError(): this {
    this.assertFieldError(this.selectors.serviceInput);
    return this;
  }

  shouldHaveCustomerError(): this {
    this.assertFieldError(this.selectors.customerInput);
    return this;
  }

  shouldHaveSessionDurationError(): this {
    this.assertFieldError(this.selectors.sessionDurationInput);
    return this;
  }

  shouldHaveSessionPriceError(): this {
    this.assertFieldError(this.selectors.sessionPriceInput);
    return this;
  }

  shouldNotHaveEndDateError(): this {
    cy.get(this.selectors.endDateInput)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('not.exist');
    return this;
  }

  getSessionDurationErrorMessage(): Cypress.Chainable<string> {
    return cy
      .get(this.selectors.sessionDurationInput)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .invoke('text');
  }

  // ── Tab error assertions ────────────────────────────────────────────────

  shouldHaveConfigurationTabError(): this {
    cy.get(this.selectors.configurationTab)
      .parent('.MuiBadge-root')
      .find(this.selectors.errorBadge)
      .should('exist');
    return this;
  }

  shouldHaveSessionFrequencyTabError(): this {
    cy.get(this.selectors.sessionFrequencyTab)
      .parent('.MuiBadge-root')
      .find(this.selectors.errorBadge)
      .should('exist');
    return this;
  }

  // ── Dropdown inspection ─────────────────────────────────────────────────

  getTherapistOptionCount(): Cypress.Chainable<number> {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapistInput);
    return cy
      .get(this.selectors.option, { timeout: 30000 })
      .should('be.visible')
      .then(($options) => $options.length);
  }

  getTherapistOptions(): Cypress.Chainable<string[]> {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.therapistInput);
    return cy
      .get(this.selectors.option, { timeout: 30000 })
      .should('be.visible')
      .then(($options) =>
        Cypress._.map($options, (option) => option.textContent?.trim() || '')
      );
  }

  hasCustomerOption(text: string): Cypress.Chainable<boolean> {
    this.dismissDropdown();
    this.openAutocomplete(this.selectors.customerInput);
    return cy
      .get(this.selectors.option, { timeout: 30000 })
      .should('be.visible')
      .then(($options) =>
        Cypress._.some($options, (option) => option.textContent?.includes(text) || false)
      );
  }

  closeCustomerDropdown(): this {
    cy.get(this.selectors.customerInput).click();
    return this;
  }

  // ── Batch fill ──────────────────────────────────────────────────────────

  fillBasicInfo(options: {
    displayName: string;
    therapistName?: string;
    serviceName?: string;
    customerNames?: string[];
  }): this {
    this.fillDisplayName(options.displayName, false);

    if (options.therapistName) {
      this.selectTherapist(options.therapistName);
    } else {
      this.selectFirstTherapist();
    }

    if (options.serviceName) {
      this.selectService(options.serviceName);
    } else {
      this.selectFirstService();
    }

    if (options.customerNames && options.customerNames.length > 0) {
      this.selectCustomers(options.customerNames);
    }

    return this;
  }

  fillSchedule(options: {
    startDate?: string;
    endDate?: string;
    duration?: string | number;
    price?: string | number;
  }): this {
    this.goToConfigurationTab();

    if (options.startDate !== undefined) {
      this.fillStartDate(options.startDate);
    }
    if (options.endDate !== undefined) {
      this.fillEndDate(options.endDate);
    }
    if (options.duration !== undefined) {
      this.fillSessionDuration(options.duration);
    }
    if (options.price !== undefined) {
      this.fillSessionPrice(options.price);
    }

    return this;
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private assertFieldError(selector: string): void {
    cy.get(selector)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('exist');
  }

  private dismissDropdown(): void {
    cy.get('body').then(($body) => {
      if ($body.find(this.selectors.autocompletePopper).length > 0) {
        cy.get('body').type('{esc}');
        cy.get(this.selectors.autocompletePopper).should('not.exist');
      }
    });
  }

  // Therapy-form dropdowns are not dialog-scoped, so the input selector is
  // already unique — hand it straight to the shared driver.
  private openAutocomplete(inputSelector: string): void {
    this.autocomplete.open(inputSelector);
  }
}
