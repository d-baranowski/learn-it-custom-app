/// <reference types="cypress" />

import {
  setupAsAdmin,
  TEST_THERAPIST,
  UPDATED_WORKING_HOURS,
  VALID_WORKING_HOURS,
} from './therapist-working-hours-test-utils';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';

describe('Working Hours - Update as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('WH_E2E_02: should resize and precisely edit an existing working hours block', { tags: '@mutating' }, () => {
    const form = new WorkingHoursFormComponent();

    form.createWeekBlock(
      TEST_THERAPIST,
      VALID_WORKING_HOURS.dayOfWeek,
      VALID_WORKING_HOURS.fromTime,
      VALID_WORKING_HOURS.tillTime
    );

    form.selectBlock(1, 0);
    form.resizeBlock(1, 0, 'right', '17:00');
    form.shouldHaveBlock(1, 0, '08:00 - 17:00 / 9h');

    form.selectBlock(1, 0);
    form.openEditTimes();
    form.fillPreciseTimes(UPDATED_WORKING_HOURS.fromTime, UPDATED_WORKING_HOURS.tillTime);
    form.applyPreciseTimes();
    form.shouldHaveBlock(1, 0, '09:00 - 17:00 / 8h');

    form.saveWeek();

    cy.reload();
    form.waitForEditorLoad();
    form.selectTherapist(TEST_THERAPIST);
    form.shouldHaveBlock(1, 0, '09:00 - 17:00 / 8h');
    form.shouldTotalHours('8h');
  });
});
