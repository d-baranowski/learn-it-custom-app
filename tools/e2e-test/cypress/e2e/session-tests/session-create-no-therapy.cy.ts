/// <reference types="cypress" />

/**
 * SES_E2E_06 — Admin creates a session without selecting a therapy
 *
 * Steps:
 * 1. Reset DB and login as admin.
 * 2. Navigate to Session page.
 * 3. Create a session without therapy: only fill therapist, room, dates, price.
 * 4. Verify the session appears in the grid.
 */

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { uniquePrice } from '../../utils/unique';

describe('Session CREATE Without Therapy (Admin)', () => {
  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  it('SES_E2E_06: should create a session without therapy and verify it in the grid', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const tomorrow = getTomorrowFormatted();
    const price = String(uniquePrice());

    // Create session without therapy (therapyText is omitted)
    createSessionViaForm({
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '10:00',
      endDate: tomorrow,
      endTime: '10:50',
      price,
    });

    adjustDateFiltersForTomorrow();

    // Verify this run's session (unique price) shows its therapist and room.
    grid.shouldContainExact(price);
    const row = grid.findRow(price, true);
    row.should('contain.text', 'Adam');
    row.should('contain.text', 'B1');
  });
});
