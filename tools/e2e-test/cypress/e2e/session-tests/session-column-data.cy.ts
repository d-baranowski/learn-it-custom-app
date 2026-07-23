/// <reference types="cypress" />

/**
 * SES_E2E_13 — Session grid columns show populated data
 *
 * After creating a session, the grid should display values in
 * the Date, Start Time, End Time, and Price columns.
 *
 * This test guards against regressions where the ViewEngine
 * returns stale views missing newly added columns.
 *
 * Also the canonical single-session create+verify path: SES_E2E_01 was
 * removed because its Adam-session flow was identical to this test's, and
 * its two-sessions-coexist assertion is covered by SES_E2E_07 (bulk delete
 * of two created sessions) and setupAdminWithTwoSessions consumers.
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPY_OPTION,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { uniquePrice } from '../../utils/unique';

describe('Session COLUMN DATA Tests (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_13: should display date, start time, end time and price in grid columns', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const tomorrow = getTomorrowFormatted();
    // Unique price identifies this run's session among tomorrow's accumulating
    // sessions, so the column-data assertions target our exact row.
    const price = String(uniquePrice());

    // Create a session for tomorrow
    createSessionViaForm({
      therapyText: ADAM_THERAPY_OPTION,
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price,
    });

    // Pin locale to `en` via URL prefix so the date cell renders in a
    // deterministic format. Next.js i18n has `localeDetection: false`, so
    // the URL prefix is the only source of truth — cookies/headers are
    // ignored. Under `en`, the dateString renderer uses date-fns 'P' with
    // the en-GB locale, producing dd/MM/yyyy — the same shape as `tomorrow`.
    cy.visit('/en/core/session');
    cy.get('html').should('have.attr', 'lang', 'en');
    adjustDateFiltersForTomorrow();

    // Scope to this run's session (unique price) and verify every column on
    // that exact row. `tomorrow` is already DD/MM/YYYY, matching the en-GB
    // short-date rendering of the dateString column.
    grid.shouldContainExact(price);
    const row = grid.findRow(price, true);
    row.should('contain.text', 'Adam');
    row.should('contain.text', 'B1');
    row.should('contain.text', tomorrow);
    row.should('contain.text', '10:00');
    row.should('contain.text', '10:50');
  });
});
