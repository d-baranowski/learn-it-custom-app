/// <reference types="cypress" />
import { loginAsAdmin } from './therapy-test-utils';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';

/**
 * THPY_E2E_14 — real-WASM validation smoke test for the therapy form.
 *
 * This is the one therapy validation test kept end-to-end: it exercises the
 * real WASM validator plus the toast/i18n wiring in a live browser. Its
 * former siblings asserted the same strings and moved to jest, where
 * wasm_resolver_therapy.test.ts covers them (with a mocked validator):
 *   THPY_E2E_15  — 'Musi być większe niż 0' on sessionDuration
 *   THPY_E2E_15b — 'Pokój jest wymagany dla sesji stacjonarnych'
 *   THPY_E2E_16  — 'Must have at least 1 character(s)/item(s)'
 *   THPY_E2E_17  — 'Must be greater than 0'
 */
describe('Therapy Form Validation - Localization Tests', () => {
  beforeEach(() => {
    loginAsAdmin();
    const navHelper = new NavigationHelper();
    navHelper.navigateToTherapy();
  });

  describe('Polish Localization', () => {
    beforeEach(() => {
      // Click language picker and select Polish
      cy.get('[data-testid="language-picker-btn"]').click();
      cy.get('[data-testid="language-picker-item-pl"]').click();
      // Click outside to close any open menus
      cy.get('body').click(0, 0);
      cy.get('nav[aria-label="breadcrumb"]', { timeout: 10000 }).should('contain.text', 'Terapia');
    });

    it('THPY_E2E_14: should display validation errors in Polish for Basic Information tab', () => {
      const form = new TherapyFormComponent();

      form.clickNew();

      // Fill Schedule & Pricing first
      form.goToConfigurationTab();
      form.fillSessionPrice('50');

      // Fill Session Frequency
      form.goToSessionFrequencyTab();
      form.clickAddSchedule();

      // Submit - should fail because Basic Info is empty
      form.submit();

      // Verify toast shows Polish translations
      cy.get('[role="status"]', { timeout: 5000 })
        .should('be.visible')
        .and('contain', 'Musi zawierać co najmniej 1 znak(ów)')
        .and('contain', 'Musi zawierać co najmniej 1 element(ów)');

      // Close the form
      form.cancel();
    });
  });
});
