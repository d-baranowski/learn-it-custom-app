/// <reference types="cypress" />

import { navigateToWorkingHoursPage, TEST_THERAPIST } from './therapist-working-hours-test-utils';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';
import { LanguageCode } from '../components-objects/language-switcher.component';

interface WHValidationConfig {
  code: LanguageCode;
  label: string;
  therapistLabel: string;
  emptyState: string;
  reverseRangeError: string;
  overlapError: string;
}

const VALIDATION_LANGUAGES: Record<string, WHValidationConfig> = {
  en: {
    code: 'en',
    label: 'English',
    therapistLabel: 'Therapist',
    emptyState: 'Select a therapist to start editing the weekly schedule.',
    reverseRangeError: 'Till time must be after from time.',
    overlapError: 'That time range overlaps another block or falls outside the editable window.',
  },
  pl: {
    code: 'pl',
    label: 'Polski',
    therapistLabel: 'Terapeuta',
    emptyState: 'Wybierz terapeutę, aby rozpocząć edycję tygodniowego grafiku.',
    reverseRangeError: 'Godzina zakończenia musi być po godzinie rozpoczęcia.',
    overlapError: 'Ten zakres czasu nakłada się na inny blok lub wypada poza edytowalnym oknem.',
  },
};

// The 'pl' iteration moved to jest — working_hours_editor_utils tests
// cover the range/overlap logic; the 'en' run stays as the live
// editor-validation smoke test (empty state + precise editor errors).
const LANGUAGE_CODES: LanguageCode[] = ['en'];

describe('Working Hours Form Validation', () => {
  beforeEach(() => {
    cy.login();
  });

  LANGUAGE_CODES.forEach((langCode) => {
    const config = VALIDATION_LANGUAGES[langCode];

    it(`WH_VAL_E2E_01_${langCode}: empty state is shown before therapist selection in ${config.label}`, () => {
      const form = new WorkingHoursFormComponent();
      const baseUrl =
        langCode === 'en'
          ? '/core/working-hours'
          : `/${langCode}/core/working-hours`;

      navigateToWorkingHoursPage(baseUrl);
      form.shouldShowText(config.emptyState);
      form.shouldNotHaveSaveButton();
      form.shouldShowFieldLabel(config.therapistLabel);
    });

    it(`WH_VAL_E2E_02_${langCode}: precise editor validation should be localized in ${config.label}`, () => {
      const form = new WorkingHoursFormComponent();
      const baseUrl =
        langCode === 'en'
          ? '/core/working-hours'
          : `/${langCode}/core/working-hours`;

      navigateToWorkingHoursPage(baseUrl);
      form.selectTherapist(TEST_THERAPIST);
      form.clearAllAndConfirm();
      form.drawBlock(1, '08:00', '10:00');
      form.drawBlock(1, '12:00', '14:00');
      form.shouldBeSubmitEnabled();

      form.selectBlock(1, 1);
      form.openEditTimes();
      form.fillPreciseTimes('14:00', '13:00');
      form.applyPreciseTimes();
      form.shouldShowText(config.reverseRangeError);
      form.shouldHavePreciseTimes('14:00', '13:00');

      form.fillPreciseTimes('09:00', '13:00');
      form.applyPreciseTimes();
      form.shouldShowText(config.overlapError);
      form.shouldHavePreciseTimes('09:00', '13:00');
    });
  });
});
