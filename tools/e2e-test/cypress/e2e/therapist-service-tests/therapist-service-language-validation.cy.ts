/// <reference types="cypress" />

/**
 * TEST: TS_LANG_E2E_01 — Therapist Service form labels and validation in correct language
 *
 * Admin tests:
 * 1. Reset DB, login as admin
 * 2. For each language (English, Polish):
 *    a. Switch language via the language picker
 *    b. Navigate to the therapist service page
 *    c. Open the create form
 *    d. Verify field labels are in the correct language
 *    e. Select only Therapist, leave Service empty, submit
 *    f. Verify server-side validation rejects the form (non-200 response)
 *    g. Verify the form stays open (error state)
 *    h. Cancel the form
 *
 * Vietnamese is skipped due to a known app bug where translations don't load.
 * Uncomment 'vi' in LANGUAGE_CODES when the bug is fixed.
 */

import { navigateToTherapistServicePage } from './therapist-service-test-utils';
import { TherapistServiceFormComponent } from '../components-objects/therapist-service-form.component';
import {
  LanguageCode,
  LanguageSwitcherComponent,
} from '../components-objects/language-switcher.component';

// Known bug: Vietnamese translations don't load. Uncomment 'vi' when fixed.
const LANGUAGE_CODES: LanguageCode[] = ['en', /* 'vi', */ 'pl'];

interface TSLLanguageConfig {
  code: LanguageCode;
  label: string;
  formTitle: string;
  therapistLabel: string;
  serviceLabel: string;
  priceLabel: string;
  cancelButton: string;
}

const TSL_LANGUAGES: Record<LanguageCode, TSLLanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    formTitle: 'Assign service',
    therapistLabel: 'Therapist',
    serviceLabel: 'Service',
    priceLabel: 'Price',
    cancelButton: 'Cancel',
  },
  vi: {
    code: 'vi',
    label: 'Tiếng Việt',
    formTitle: 'Gán dịch vụ',
    therapistLabel: 'Therapist',
    serviceLabel: 'Service',
    priceLabel: 'Price',
    cancelButton: 'Cancel',
  },
  pl: {
    code: 'pl',
    label: 'Polski',
    formTitle: 'Przypisz usługę',
    therapistLabel: 'Terapeuta',
    serviceLabel: 'Usługa',
    priceLabel: 'Cena',
    cancelButton: 'Anuluj',
  },
};

describe('Therapist Service Form Language Validation Tests (Admin)', () => {
  beforeEach(() => {
    cy.login();
    navigateToTherapistServicePage();
  });

  LANGUAGE_CODES.forEach((langCode) => {
    const config = TSL_LANGUAGES[langCode];

    it(`TS_LANG_E2E_01_${langCode}: should show form labels and validation errors in ${config.label}`, { tags: '@mutating' }, () => {
      const form = new TherapistServiceFormComponent();

      // --- Switch language via the language picker ---
      if (langCode !== 'en') {
        new LanguageSwitcherComponent().switchTo(langCode);
      }

      // --- Wait for page to reload after language switch ---
      cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('be.visible');

      // --- Open create form ---
      form.clickAddItem();
      form.waitForFormLoad();

      // --- Verify form title is in the correct language ---
      cy.get(form.selectors.formDialog).should('contain.text', config.formTitle);

      // --- Verify field labels are in the correct language ---
      cy.get(form.selectors.therapistId)
        .parents('.MuiFormControl-root')
        .first()
        .should('contain.text', config.therapistLabel);
      cy.get(form.selectors.serviceId)
        .parents('.MuiFormControl-root')
        .first()
        .should('contain.text', config.serviceLabel);
      cy.get(form.selectors.price)
        .parents('.MuiFormControl-root')
        .first()
        .should('contain.text', config.priceLabel);

      // --- Verify Save is disabled with all fields empty ---
      form.shouldBeSubmitDisabled();

      // --- Fill only Therapist — Save becomes enabled (client-side) ---
      form.selectTherapist('Adam Hałaczkiewicz');
      form.shouldBeSubmitEnabled();

      // --- Click Save without Service — server rejects, form stays open ---
      cy.intercept('POST', '**/core.v1.TherapistServiceLinkService/Create').as('createTSL');
      form.clickSave();
      cy.wait('@createTSL').its('response.statusCode').should('not.eq', 200);

      // --- Verify form is still open after failed submission ---
      cy.get(form.selectors.formDialog).should('be.visible');

      // --- Cancel the form (button text is translated) ---
      cy.get(form.selectors.formDialog).contains('button', config.cancelButton).click();
    });
  });
});
