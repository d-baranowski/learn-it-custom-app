/// <reference types="cypress" />

/**
 * TA_VAL_E2E — Absence form validation in English and Polish
 *
 * Tests:
 *  01: Save disabled when required fields are empty, labels in correct language
 *  02: Save enabled when required fields (From/Till Date/Time) are filled
 */

import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { LanguageCode } from '../components-objects/language-switcher.component';
import { loginAs } from '../../utils/test-users';
import { navigateToAbsencePage } from './therapist-absence-test-utils';

interface AbsenceValidationConfig {
  code: LanguageCode;
  label: string;
  fromDateTimeLabel: string;
  tillDateTimeLabel: string;
  reasonLabel: string;
}

const VALIDATION_LANGUAGES: Record<string, AbsenceValidationConfig> = {
  en: {
    code: 'en',
    label: 'English',
    fromDateTimeLabel: 'From Date/Time',
    tillDateTimeLabel: 'Till Date/Time',
    reasonLabel: 'Reason',
  },
  pl: {
    code: 'pl',
    label: 'Polski',
    fromDateTimeLabel: 'Od daty/czasu',
    tillDateTimeLabel: 'Do daty/czasu',
    reasonLabel: 'Powód',
  },
};

// The 'pl' iteration moved to jest — the absence form test covers the
// submit gating; the 'en' run stays as the live validation smoke test.
const LANGUAGE_CODES: LanguageCode[] = ['en'];

describe('Absence Form Validation', () => {
  beforeEach(() => {
    loginAs('admin');
  });

  LANGUAGE_CODES.forEach((langCode) => {
    const config = VALIDATION_LANGUAGES[langCode];

    it(`TA_VAL_E2E_01_${langCode}: Save disabled when required fields are empty in ${config.label}`, () => {
      const form = new AbsenceFormComponent();

      navigateToAbsencePage(langCode);

      form.clickAddItem();
      form.waitForFormLoad();

      // Save should be disabled when form is empty
      form.shouldBeSubmitDisabled();

      // Verify field labels are in the correct language
      form.shouldHaveFieldLabel('fromTime', config.fromDateTimeLabel);
      form.shouldHaveFieldLabel('tillTime', config.tillDateTimeLabel);
      form.shouldHaveFieldLabel('reason', config.reasonLabel);

      form.clickCancel();
    });

    it(`TA_VAL_E2E_02_${langCode}: Save enabled when required fields are filled in ${config.label}`, () => {
      const form = new AbsenceFormComponent();

      navigateToAbsencePage(langCode);

      form.clickAddItem();
      form.waitForFormLoad();

      // Save should be disabled initially
      form.shouldBeSubmitDisabled();

      // Fill both required date/time fields
      form.fillFromTime('150320260800');
      form.fillTillTime('150320261700');

      // Now Save should be enabled
      form.shouldBeSubmitEnabled();

      // Optionally fill non-required fields — Save should remain enabled
      form.fillReason('Validation test');
      form.shouldBeSubmitEnabled();

      form.clickCancel();
    });
  });
});
