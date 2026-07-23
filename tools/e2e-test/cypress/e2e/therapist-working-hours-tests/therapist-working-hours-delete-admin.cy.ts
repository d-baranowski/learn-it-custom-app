/// <reference types="cypress" />

import {
  setupAsAdmin,
  TEST_THERAPIST,
  VALID_WORKING_HOURS,
} from './therapist-working-hours-test-utils';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';

describe('Working Hours - Delete as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('WH_E2E_03: should delete a block, support undo, and persist a cleared day', { tags: '@mutating' }, () => {
    const form = new WorkingHoursFormComponent();

    form.createWeekBlock(
      TEST_THERAPIST,
      VALID_WORKING_HOURS.dayOfWeek,
      VALID_WORKING_HOURS.fromTime,
      VALID_WORKING_HOURS.tillTime
    );

    form.selectBlock(1, 0);
    form.deleteSelectedBlock();
    form.undoDelete();
    form.shouldHaveBlock(1, 0, '08:00 - 16:00 / 8h');

    form.selectBlock(1, 0);
    form.deleteSelectedBlock();
    form.shouldNotHaveBlock(1, 0);
    form.shouldTotalHours('0h');
    form.shouldTotalDays('0');

    form.saveWeek();
  });
});
