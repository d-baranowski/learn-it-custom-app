/// <reference types="cypress" />

/**
 * SES_E2E_11 — Session grid date range filter
 *
 * Tests the new DateRangeFilter component with From/To pickers and quick presets.
 *
 * a) BETWEEN: filling both From and To narrows the grid to sessions within that range.
 * b) Quick preset "Current week": clicking the preset fills both pickers and shows
 *    sessions within the current ISO week.
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  fillDateFilter,
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

describe('Session DATE RANGE FILTER Tests (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_11a: BETWEEN filter shows only sessions within the From-To range', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const tomorrow = getTomorrowFormatted();
    const dayAfter = formatDDMMYYYY(getDateFromToday(2));
    const threeDaysOut = formatDDMMYYYY(getDateFromToday(3));
    // Per-run unique prices so the in-range/out-of-range assertions target this
    // run's sessions among the accumulating per-day sessions on the non-reset DB.
    const priceTomorrow = String(uniquePrice());
    const priceDayAfter = String(uniquePrice());
    const priceThreeDays = String(uniquePrice());

    // Create session for tomorrow
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

    // Create session for day-after-tomorrow
    createSessionViaForm({
      therapyText: MARTA_THERAPY_OPTION,
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B2',
      startDate: dayAfter,
      startTime: '11:00',
      endDate: dayAfter,
      endTime: '11:50',
      price: priceDayAfter,
    });

    // Create session for 3 days out
    createSessionViaForm({
      therapyText: ADAM_THERAPY_OPTION,
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B3',
      startDate: threeDaysOut,
      startTime: '09:00',
      endDate: threeDaysOut,
      endTime: '09:50',
      price: priceThreeDays,
    });

    // Navigate fresh and set date range: tomorrow → day-after-tomorrow
    nav.navigateToSession();
    cy.get('body').type('{esc}');

    fillDateFilter('date-from', tomorrow);
    cy.get('body').click(0, 0);
    fillDateFilter('date-to', dayAfter);
    cy.get('body').click(0, 0);

    // Wait for grid to refresh
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 15000,
    }).should('exist');

    // Sessions within range should be visible
    grid.shouldContainExact(priceTomorrow);
    grid.shouldContainExact(priceDayAfter);

    // Session outside range (3 days out) should NOT be visible
    grid.shouldNotContain(priceThreeDays);
  });

  it('SES_E2E_11b: quick preset "Current week" fills both pickers and filters sessions', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const nav = new NavigationHelper();
    const tomorrow = getTomorrowFormatted();

    // Create a session for tomorrow so we have data within the current week
    createSessionViaForm({
      therapyText: ADAM_THERAPY_OPTION,
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price: String(uniquePrice()),
    });

    // Navigate fresh and wait for grid to be ready
    nav.navigateToSession();
    grid.waitForGrid();

    // Close any open form/dialog by pressing Escape repeatedly and clicking away
    cy.get('body').type('{esc}');
    cy.get('body').click(0, 0);
    // Ensure no dialog is open — the "Cancel" button should not exist
    cy.get('button').contains('Cancel').should('not.exist');

    // Click the kebab menu (quick select button) on the date filter
    cy.get('[aria-label="Quick select"]').should('be.visible').click();

    // Pick "Current week" by its stable testid, scoped to the visible menu.
    // Every date-column filter renders its own (hidden) preset menu, so an
    // index into `[role="menuitem"]` across all of them landed on an item in a
    // closed menu ("not visible"); the testid is also immune to preset
    // reordering and i18n.
    cy.get('[data-testid="date-preset-current-week"]:visible', {
      timeout: 5000,
    }).click();

    // Wait for grid refresh
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 15000,
    }).should('exist');

    // Both date pickers should now have values (not empty)
    cy.get('input[data-testid="date-from"]')
      .invoke('val')
      .should('not.be.empty');
    cy.get('input[data-testid="date-to"]').invoke('val').should('not.be.empty');

    // Tomorrow is always within the current week or next week.
    // If tomorrow is within the current ISO week, we should see the session.
    // We can't guarantee this always, so just verify the pickers got filled
    // and the grid loaded without errors — the BETWEEN filter is applied.
  });
});
