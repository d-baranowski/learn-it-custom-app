/// <reference types="cypress" />

/**
 * TEST: WH_E2E_04 — Working hours reflected in therapist calendar as green background
 * TEST: WH_E2E_05 — Session outside working hours shows warning icon in calendar
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { CalendarComponent } from '../components-objects/calendar.component';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { formatDateISO, formatDDMMYYYY, getNextWeekday } from '../../utils/date-utils';
import {
  assertOutsideWorkingHoursWarningVisible,
  assertWorkingHoursBackgroundRendered,
  getTodayOrLastWeekdayISO,
  SECOND_THERAPIST,
} from './therapist-working-hours-test-utils';

describe('Working Hours - Calendar Verification', () => {
  beforeEach(() => {
    cy.login();
  });

  it('WH_E2E_04: working hours should appear as green background in therapist calendar', () => {
    const nav = new NavigationHelper();
    const calendar = new CalendarComponent();
    const dateISO = getTodayOrLastWeekdayISO();

    nav.navigateToTherapistCalendar(dateISO);
    calendar.waitForCalendar();
    calendar.waitForEvents();

    assertWorkingHoursBackgroundRendered();

    cy.screenshot('wh-calendar-green-background');
  });

  it('WH_E2E_05: sessions outside working hours should show warning icon in calendar', { tags: '@mutating' }, () => {
    const nav = new NavigationHelper();
    const calendar = new CalendarComponent();
    const form = new SessionFormComponent();
    const target = getNextWeekday();

    // 07:00 is well before Dr. Anna Kowalska's 09:00 start (WH: 9am-5pm
    // Mon-Fri), guaranteeing an outside-hours warning.
    nav.navigateToSession();
    form.clickNew();
    form.waitForFormLoad();
    form.selectTherapist(SECOND_THERAPIST);
    form.selectRoom('T7');
    form.fillStartDateTime(formatDDMMYYYY(target), '07:00');
    form.fillEndDateTime(formatDDMMYYYY(target), '07:50');
    form.fillPrice('100');
    form.submit();
    form.waitForFormClose();

    nav.navigateToTherapistCalendar(formatDateISO(target));
    calendar.waitForCalendar();
    calendar.waitForEvents();

    assertOutsideWorkingHoursWarningVisible();

    cy.screenshot('wh-calendar-outside-hours-indicator');
  });
});
