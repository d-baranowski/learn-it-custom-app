/// <reference types="cypress" />

import {
  setupSessionTestForAdmin,
  getTomorrowFormatted,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';

describe('Session - Find Available Room — Validation', () => {
  const form = new SessionFormComponent();

  beforeEach(() => {
    setupSessionTestForAdmin();
  });

  // SES_FAR_E2E_01/_02 (disable/enable gating) migrated to jest —
  // session_form.test.tsx 'Find Available Room' describe covers both.

  it('SES_FAR_E2E_03: button auto-fills the Room field with an available room', { tags: '@mutating' }, () => {
    const tomorrow = getTomorrowFormatted();

    form.clickNew();
    form.waitForFormLoad();

    form.fillDate(tomorrow);
    form.fillStartTime('10:00');
    form.fillEndTime('10:50');

    cy.get(form.selectors.roomInput).invoke('val').should('eq', '');

    form.clickFindAvailableRoom();

    cy.get(form.selectors.roomInput, { timeout: 10000 })
      .invoke('val')
      .should('not.eq', '');

    form.cancel();
    form.waitForFormClose();
  });
});
