/// <reference types="cypress" />

/**
 * SES_E2E_10 — Session grid filtering by date
 *
 * Tests:
 * a) Filter by date — set date filter to tomorrow, verify sessions appear;
 *    change to a different day, verify different sessions appear.
 *
 * NOTE: The session grid has a date range filter with two DatePickers
 *   (data-testid="date-from" and data-testid="date-to").
 *   Using only "date-from" dispatches a GTE filter.
 *
 * Therapy and therapist column filters do NOT exist on the session grid.
 * TODO: add data-testid grid filters for therapy and therapist columns to UI
 * Once added, create SES_E2E_10c (filter by therapy) and SES_E2E_10d (filter by therapist).
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  fillDateFilter,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPY_OPTION,
  ADAM_THERAPIST_OPTION,
  MARTA_THERAPY_OPTION,
  MARTA_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { getDateFromToday, formatDDMMYYYY } from '../../utils/date-utils';
import { uniquePrice } from '../../utils/unique';

describe('Session FILTER Tests (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_10a: should filter sessions by date to show only matching sessions', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const tomorrow = getTomorrowFormatted();
    const dayAfterTomorrow = formatDDMMYYYY(getDateFromToday(2));
    // Per-run unique prices identify this run's sessions among the accumulating
    // per-day sessions on the non-reset DB.
    const priceTomorrow = String(uniquePrice());
    const priceDayAfter = String(uniquePrice());

    // Create a session for tomorrow
    createSessionViaForm({
      therapyText: ADAM_THERAPY_OPTION,
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price: priceTomorrow,
    });

    // Create a session for day-after-tomorrow
    createSessionViaForm({
      therapyText: MARTA_THERAPY_OPTION,
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B2',
      startDate: dayAfterTomorrow,
      startTime: '11:00',
      endDate: dayAfterTomorrow,
      endTime: '11:50',
      price: priceDayAfter,
    });

    const nav = new NavigationHelper();

    // Filter to show only tomorrow's sessions
    adjustDateFiltersForTomorrow();

    // Adam's session (tomorrow) should be visible
    grid.shouldContainExact(priceTomorrow);

    // Navigate fresh and filter to day-after-tomorrow only
    nav.navigateToSession();
    cy.get('body').type('{esc}');
    fillDateFilter('date-from', dayAfterTomorrow);
    cy.get('body').click(0, 0);
    grid.waitForGrid();

    // Marta's session (day-after-tomorrow) should now be visible
    grid.shouldContainExact(priceDayAfter);
  });
});
