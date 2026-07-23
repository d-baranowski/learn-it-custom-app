/// <reference types="cypress" />

/**
 * SES_E2E_11 — Session grid filtering by customer
 *
 * Sessions and customers have an m2m relationship through core.session_customer;
 * the Customers column on the Session grid renders the aggregated `customer_labels`
 * text view column (same pattern as the Therapy grid). Filtering by that column
 * with ILIKE drives the customer quick filter — no autocomplete-by-id required,
 * which is what was tried first and produced a 502 because the generic
 * where-builder panics on fields it can't resolve to a real view column.
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  getTomorrowFormatted,
  MARTA_THERAPY_OPTION,
  MARTA_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { uniquePrice } from '../../utils/unique';

describe('Session FILTER by Customer (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_11: quick filter narrows sessions to those of the named customer', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const tomorrow = getTomorrowFormatted();
    const price = String(uniquePrice());

    createSessionViaForm({
      therapyText: MARTA_THERAPY_OPTION,
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B2',
      startDate: tomorrow,
      startTime: '11:00',
      endDate: tomorrow,
      endTime: '11:50',
      price,
      customerTexts: ['Smith Jane'],
    });

    grid.waitForGrid();

    // Filter on the aggregated Customers text column (ILIKE), per the
    // header note — the id-autocomplete path this test originally used
    // isn't backed by a real view column.
    grid.search('filter-customerLabels', 'Smith Jane');
    grid.waitForFetchSettled();

    grid.shouldContainExact('Smith Jane');
    grid.shouldContainExact(price);
  });
});
