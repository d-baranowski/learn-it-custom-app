/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import { fillDateFilter } from '../session-tests/session-test-utils';
import {
  createTherapyWithFrequency,
  formatDDMMYYYY,
  getNextMonday,
  openTherapyToFrequencyTab,
} from '../therapy-tests/therapy-frequency-test-helpers';

describe(
  'Session Generate — Dialog & Preview',
  () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const gen = new SessionGenerateComponent();

    beforeEach(() => {
      cy.login();
    });

    it('SESGEN_E2E_01: should open the generate-sessions dialog and show UI elements', () => {
      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'SesGen',
      });

      openTherapyToFrequencyTab(grid, form, name);

      form.clickGenerateSessions();

      gen.waitForWindow();

      gen.getFromInput().should('exist');
      gen.getUntilInput().should('exist');

      cy.getByTestId('session-generate-cancel-btn').should('exist');
      cy.getByTestId('session-generate-last-session-btn').should('exist');

      // Auto-preview fires on open — session list should appear
      gen.waitForSessionList();

      gen.clickCancel();

      form.cancel();
      form.waitForFormClose();
    });

    // SESGEN_E2E_02 (preview + summary + table) was a strict subset of this
    // test's preview phase and was folded in — its two unique assertions
    // (no duplicate alert, confirm enabled) now run before clickConfirm.
    it('SESGEN_E2E_03: should generate sessions and verify in session grid', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const endDate = new Date(nextMonday);
      endDate.setDate(endDate.getDate() + 28);

      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'SesGen',
        startDate: nextMonday,
        endDate,
      });

      openTherapyToFrequencyTab(grid, form, name);
      form.clickGenerateSessions();
      gen.waitForWindow();

      gen.fillFromDate(formatDDMMYYYY(nextMonday));
      gen.fillUntilDate(formatDDMMYYYY(endDate));

      gen.clickPreview();
      gen.shouldHaveSummary('will be created');
      gen.shouldShowTable();
      gen.shouldNotHaveDuplicateAlert();
      gen.shouldBeConfirmEnabled();

      gen.clickConfirm();
      gen.waitForWindowClose();

      form.cancel();

      nav.navigateToSession();

      const filterDate = formatDDMMYYYY(nextMonday);
      fillDateFilter('date-from', filterDate);
      cy.get('body').click(0, 0);
      cy.get('[data-testid="rpg-grid-component-wrapper"]').should('exist');

      grid.shouldContain('Adam');
      grid.shouldContain('B1');
    });
  }
);
