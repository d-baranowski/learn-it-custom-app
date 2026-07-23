/// <reference types="cypress" />

/**
 * TEST: THR_VAL_E2E_01 — Therapist form labels and validation react correctly per UI language
 */

import { TherapistFormComponent } from '../components-objects/therapist-form.component';
import {
  LanguageSwitcherComponent,
  LanguageCode,
} from '../components-objects/language-switcher.component';

// The 'pl' iteration moved to jest — wasm resolver/custom-validation
// tests assert the same translated strings. The 'en' run stays as the
// real-WASM validation smoke test for this form.
const LANGUAGE_CODES: LanguageCode[] = ['en'];

interface TherapistLanguageConfig {
  code: LanguageCode;
  label: string;
  tabProfile: string;
  tabSettings: string;
  descriptionEnLabel: string;
  metaDescriptionEnLabel: string;
  contactEmailLabel: string;
  contactPhoneLabel: string;
  languagesLabel: string;
}

const THERAPIST_LANGUAGES: Record<LanguageCode, TherapistLanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    tabProfile: 'Profile',
    tabSettings: 'Settings',
    descriptionEnLabel: 'Description (English)',
    metaDescriptionEnLabel: 'Meta Description (English)',
    contactEmailLabel: 'Contact Email',
    contactPhoneLabel: 'Contact Phone',
    languagesLabel: 'Languages',
  },
  vi: {
    code: 'vi',
    label: 'Tiếng Việt',
    tabProfile: 'Profile',
    tabSettings: 'Settings',
    descriptionEnLabel: 'Description (English)',
    metaDescriptionEnLabel: 'Meta Description (English)',
    contactEmailLabel: 'Contact Email',
    contactPhoneLabel: 'Contact Phone',
    languagesLabel: 'Languages',
  },
  pl: {
    code: 'pl',
    label: 'Polski',
    tabProfile: 'Profile',
    tabSettings: 'Ustawienia',
    descriptionEnLabel: 'Opis (angielski)',
    metaDescriptionEnLabel: 'Meta opis (angielski)',
    contactEmailLabel: 'Email kontaktowy',
    contactPhoneLabel: 'Telefon kontaktowy',
    languagesLabel: 'Języki',
  },
};

describe('Therapist Form Language Validation Tests (Admin)', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('POST', '**/core.v1.TherapistService/List').as('therapistList');
    cy.visit('/core/therapist');
    cy.wait('@therapistList');
    cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('be.visible');
  });

  LANGUAGE_CODES.forEach((langCode) => {
    const config = THERAPIST_LANGUAGES[langCode];

    it(`THR_VAL_E2E_01_${langCode}: should show form labels and validation errors in ${config.label}`, () => {
      const langSwitcher = new LanguageSwitcherComponent();
      const form = new TherapistFormComponent();

      langSwitcher.switchTo(langCode);
      cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('be.visible');

      form.clickAddItem();
      form.waitForFormLoad();

      cy.get(form.selectors.formTabs)
        .should('contain.text', config.tabProfile)
        .and('contain.text', config.tabSettings);

      form.goToEnglishTab();
      cy.get(form.selectors.formWrapper)
        .should('contain.text', config.descriptionEnLabel)
        .and('contain.text', config.metaDescriptionEnLabel);

      form.goToContactSettingsTab();
      cy.get(form.selectors.formWrapper)
        .should('contain.text', config.contactEmailLabel)
        .and('contain.text', config.contactPhoneLabel)
        .and('contain.text', config.languagesLabel);

      form.fillEnglishTab({
        professionalTitle: 'Validation English Title',
        description: 'Validation English Description',
      });
      form.fillPolishTab({
        professionalTitle: 'Walidacja Polski Tytul',
        description: 'Walidacja Polski Opis',
      });
      form.goToContactSettingsTab();
      form.fillSlug(`validation-${langCode}-therapist`);
      form.fillContactEmail('invalid-email');

      form.clickSave();

      if (langCode === 'en') {
        cy.get(form.selectors.contactSettingsTab)
          .parent('.MuiBadge-root')
          .find('.MuiBadge-badge')
          .should('have.text', '1');
      }

      form.shouldHaveFieldError(form.selectors.contactEmail);
      form.clickCancel();
    });
  });
});
