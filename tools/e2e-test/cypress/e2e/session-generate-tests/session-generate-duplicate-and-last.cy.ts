/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import {
  createTherapyWithFrequency,
  formatDDMMYYYY,
  generateSessionsViaPreview,
  getNextMonday,
  openTherapyToFrequencyTab,
} from '../therapy-tests/therapy-frequency-test-helpers';

describe(
  'Session Generate — Duplicate & Last Session',
  () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const gen = new SessionGenerateComponent();

    beforeEach(() => {
      cy.login();
    });

    it('SESGEN_E2E_04: should detect duplicates when previewing already-generated sessions', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const twoWeeksLater = new Date(nextMonday);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(twoWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'SesGen',
        startDate: nextMonday,
        endDate: twoWeeksLater,
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      form.cancel();
      grid.waitForGrid();
      openTherapyToFrequencyTab(grid, form, name);
      form.clickGenerateSessions();
      gen.waitForWindow();

      gen.fillFromDate(fromStr);
      gen.fillUntilDate(untilStr);

      gen.clickPreview();

      gen.shouldHaveDuplicateAlert();
      gen.shouldHaveSummary('will be created');
      gen.shouldBeConfirmDisabled();

      gen.clickCancel();

      form.cancel();
      form.waitForFormClose();
    });

    it('SESGEN_E2E_05: should auto-fill "From" date using last session button', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const twoWeeksLater = new Date(nextMonday);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(twoWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'SesGen',
        startDate: nextMonday,
        endDate: twoWeeksLater,
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      form.cancel();
      grid.waitForGrid();
      openTherapyToFrequencyTab(grid, form, name);
      form.clickGenerateSessions();
      gen.waitForWindow();

      gen
        .getFromInput()
        .invoke('val')
        .then((valueBefore) => {
          gen.clickLastSession();

          gen
            .getFromInput()
            .invoke('val')
            .should('match', /^\d{2}\/\d{2}\/\d{4}$/)
            .and('not.eq', valueBefore);
        });

      gen.clickCancel();
    });
  }
);
