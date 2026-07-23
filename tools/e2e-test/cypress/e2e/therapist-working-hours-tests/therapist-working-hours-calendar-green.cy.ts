/// <reference types="cypress" />

import { CalendarComponent } from '../components-objects/calendar.component';
import { WorkingHoursFormComponent } from '../components-objects/working-hours-view.component';
import { formatDateISO, getNextMonday } from '../../utils/date-utils';
import {
  assertWorkingHoursBackgroundRendered,
  navigateToWorkingHoursPage,
  TEST_THERAPIST,
} from './therapist-working-hours-test-utils';

describe('Working Hours - Calendar Green Background Verification', () => {
  beforeEach(() => {
    cy.login();
  });

  it('WH_E2E_06: should show green background for working hours and update when changed', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();
    const form = new WorkingHoursFormComponent();

    const dateParam = formatDateISO(getNextMonday());

    navigateToWorkingHoursPage();
    form.createWeekBlock(TEST_THERAPIST, 1, '08:00', '16:00');
    form.shouldHaveBlock(1, 0, '08:00 - 16:00 / 8h');

    cy.visit(`/core/therapist-calendar?view=day&date=${dateParam}`);
    calendar.waitForCalendar();
    assertWorkingHoursBackgroundRendered();

    navigateToWorkingHoursPage();
    form.waitForEditorLoad();
    form.selectTherapist(TEST_THERAPIST);
    form.selectBlock(1, 0);
    form.openEditTimes();
    form.fillPreciseTimes('10:00', '18:00');
    form.applyPreciseTimes();
    form.shouldHaveBlock(1, 0, '10:00 - 18:00 / 8h');
    form.saveWeek();

    cy.visit(`/core/therapist-calendar?view=day&date=${dateParam}`);
    calendar.waitForCalendar();
    assertWorkingHoursBackgroundRendered();
  });
});
