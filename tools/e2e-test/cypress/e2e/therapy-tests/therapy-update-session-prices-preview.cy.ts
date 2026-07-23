/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import { SessionPriceUpdateComponent } from '../components-objects/session-price-update.component';
import {
  createTherapyWithFrequency,
  formatDDMMYYYY,
  generateSessionsViaPreview,
  getNextMonday,
  openTherapyToFrequencyTab,
} from './therapy-frequency-test-helpers';

describe(
  'Update Session Prices — Preview',
  () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const gen = new SessionGenerateComponent();
    const priceUpdate = new SessionPriceUpdateComponent();
    const priceUpdateFromForm = new SessionPriceUpdateComponent(
      'session-update-prices'
    );

    beforeEach(() => {
      cy.login();
    });

    it('THPY_PRICE_E2E_03: should preview sessions and show summary with table', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const fourWeeksLater = new Date(nextMonday);
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(fourWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: fourWeeksLater,
        price: '200',
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      form.cancel();
      grid.waitForGrid();
      grid.shouldContain(name);

      priceUpdate.openFromGridActions(name);

      priceUpdate.fillFromDate(fromStr);
      priceUpdate.fillUntilDate(untilStr);

      priceUpdate.clickPreview();

      priceUpdate.shouldHaveSummary('session(s) found');
      priceUpdate.shouldShowTable();
      priceUpdate.getNewPriceInput().should('exist');

      priceUpdate.fillNewPrice('300');
      priceUpdate.shouldBeConfirmEnabled();

      priceUpdate.clickCancel();
    });

    it('THPY_PRICE_E2E_04: should show no sessions message when no sessions exist in range', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const fourWeeksLater = new Date(nextMonday);
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: fourWeeksLater,
      });

      priceUpdate.openFromGridActions(name);

      priceUpdate.fillFromDate(formatDDMMYYYY(nextMonday));
      priceUpdate.fillUntilDate(formatDDMMYYYY(fourWeeksLater));

      priceUpdate.clickPreview();

      priceUpdate.shouldShowNoSessions();

      priceUpdate.clickCancel();
    });

    it('THPY_PRICE_E2E_11: should allow clearing From date to show all sessions', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const fourWeeksLater = new Date(nextMonday);
      fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(fourWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: fourWeeksLater,
        price: '120',
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);
      priceUpdateFromForm.clickPreview();
      priceUpdateFromForm.shouldHaveSummary('session(s) found');

      priceUpdateFromForm.clearFromDate();

      priceUpdateFromForm.clickPreview();

      priceUpdateFromForm.shouldHaveSummary('session(s) found');
      priceUpdateFromForm.shouldShowTable();

      priceUpdateFromForm.clickCancel();

      form.cancel();
    });
  }
);
