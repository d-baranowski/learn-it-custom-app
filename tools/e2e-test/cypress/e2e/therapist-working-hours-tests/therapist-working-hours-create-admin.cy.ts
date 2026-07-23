/// <reference types="cypress" />

import {
  SECOND_THERAPIST,
  setupAsAdmin,
  TEST_THERAPIST,
  VALID_WORKING_HOURS,
} from './therapist-working-hours-test-utils';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';

describe('Working Hours - Create as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('WH_E2E_01: should create a working week block by drag and save it', { tags: '@mutating' }, () => {
    const form = new WorkingHoursFormComponent();

    form.waitForEditorLoad();
    form.shouldShowText('Select a therapist to start editing the weekly schedule.');

    form.createWeekBlock(
      TEST_THERAPIST,
      VALID_WORKING_HOURS.dayOfWeek,
      VALID_WORKING_HOURS.fromTime,
      VALID_WORKING_HOURS.tillTime
    );

    form.shouldHaveBlock(1, 0, '08:00 - 16:00');
    form.shouldTotalHours('8h');
    form.shouldTotalDays('1');

    cy.reload();
    form.waitForEditorLoad();
    form.selectTherapist(TEST_THERAPIST);
    form.shouldHaveBlock(1, 0, '08:00 - 16:00 / 8h');
    form.shouldTotalHours('8h');
    form.shouldTotalDays('1');
  });

  it('WH_E2E_01B: should support templates, day copy, and copy-from-therapist flow', { tags: '@mutating' }, () => {
    const form = new WorkingHoursFormComponent();

    form.waitForEditorLoad();

    form.selectTherapist(SECOND_THERAPIST);
    form.clearAllAndConfirm();
    form.applyTemplate('mon_fri_8_16');
    form.shouldHaveBlock(1, 0, '08:00 - 16:00 / 8h');
    form.shouldTotalHours('40h');
    form.shouldTotalDays('5');
    form.saveWeek();

    form.selectTherapist(TEST_THERAPIST);
    form.clearAllAndConfirm();
    form.drawBlock(1, '09:00', '12:00');
    form.copyDayToTargets(1, [3]);
    form.shouldHaveBlock(1, 0, '09:00 - 12:00 / 3h');
    form.shouldHaveBlock(3, 0, '09:00 - 12:00 / 3h');

    form.copyFromAnotherTherapist(SECOND_THERAPIST);
    form.shouldHaveBlock(1, 0, '08:00 - 16:00 / 8h');
    form.shouldHaveBlock(5, 0, '08:00 - 16:00 / 8h');
    form.shouldTotalHours('40h');
    form.shouldTotalDays('5');

    form.saveWeek();
  });
});
