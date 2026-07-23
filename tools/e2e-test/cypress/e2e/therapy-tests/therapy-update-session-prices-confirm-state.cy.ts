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
  'Update Session Prices — Confirm State',
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

    it('THPY_PRICE_E2E_07: should disable confirm button when new price is empty', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const twoWeeksLater = new Date(nextMonday);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(twoWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: twoWeeksLater,
        price: '100',
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

      priceUpdate.clearNewPrice();

      priceUpdate.shouldBeConfirmDisabled();

      priceUpdate.fillNewPrice('250');
      priceUpdate.shouldBeConfirmEnabled();

      priceUpdate.clickCancel();
    });

    it('THPY_PRICE_E2E_08: should auto-populate new price from therapy session price', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const threeWeeksLater = new Date(nextMonday);
      threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(threeWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: threeWeeksLater,
        price: '175',
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);
      priceUpdateFromForm.clickPreview();
      priceUpdateFromForm.shouldHaveSummary('session(s) found');

      priceUpdateFromForm.shouldHaveNewPrice('175');

      priceUpdateFromForm.clickCancel();

      form.cancel();
    });

    it('THPY_PRICE_E2E_09: should show warning when new price differs from therapy price', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const threeWeeksLater = new Date(nextMonday);
      threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(threeWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: threeWeeksLater,
        price: '200',
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);
      priceUpdateFromForm.clickPreview();
      priceUpdateFromForm.shouldHaveSummary('session(s) found');

      priceUpdateFromForm.shouldHaveNewPrice('200');
      priceUpdateFromForm.shouldNotHaveMismatchWarning();

      priceUpdateFromForm.fillNewPrice('999');

      priceUpdateFromForm.shouldHaveMismatchWarning('therapy price that differs');

      priceUpdateFromForm.clickCancel();

      form.cancel();
    });

    it('THPY_PRICE_E2E_10: should render room column with parsed label, not raw JSON', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const twoWeeksLater = new Date(nextMonday);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(twoWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: twoWeeksLater,
        price: '100',
      });

      openTherapyToFrequencyTab(grid, form, name);
      generateSessionsViaPreview(form, gen, fromStr, untilStr);

      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);
      priceUpdateFromForm.clickPreview();
      priceUpdateFromForm.shouldHaveSummary('session(s) found');

      priceUpdateFromForm.tableShouldContain('B1');
      priceUpdateFromForm.tableShouldNotContainRawJson();

      priceUpdateFromForm.clickCancel();

      form.cancel();
    });
  }
);
