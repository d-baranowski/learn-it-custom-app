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
  'Update Session Prices — Exclude & Update',
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

    it('THPY_PRICE_E2E_05: should exclude sessions via checkbox and update count', { tags: '@mutating' }, () => {
      const nextMonday = getNextMonday();
      const threeWeeksLater = new Date(nextMonday);
      threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

      const fromStr = formatDDMMYYYY(nextMonday);
      const untilStr = formatDDMMYYYY(threeWeeksLater);

      const name = createTherapyWithFrequency(nav, form, grid, {
        startDate: nextMonday,
        endDate: threeWeeksLater,
        price: '150',
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
      priceUpdate.shouldHaveSummary('selected for update');

      priceUpdate.toggleExcludeRow(0);

      priceUpdate.shouldHaveSummary('selected for update');

      priceUpdate.clickCancel();
    });

    it('THPY_PRICE_E2E_06: should update session prices and verify the change', { tags: '@mutating' }, () => {
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

      form.cancel();
      grid.waitForGrid();

      openTherapyToFrequencyTab(grid, form, name);
      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);

      priceUpdateFromForm.clickPreview();
      priceUpdateFromForm.shouldHaveSummary('session(s) found');

      priceUpdateFromForm.tableShouldContain('200');

      priceUpdateFromForm.fillNewPrice('350');

      priceUpdateFromForm.clickConfirm();

      priceUpdateFromForm.waitForWindowClose();

      priceUpdateFromForm.openFromTherapyForm();

      priceUpdateFromForm.fillFromDate(fromStr);
      priceUpdateFromForm.fillUntilDate(untilStr);
      priceUpdateFromForm.clickPreview();

      priceUpdateFromForm.shouldHaveSummary('session(s) found');
      priceUpdateFromForm.tableShouldContain('350');

      priceUpdateFromForm.clickCancel();

      form.cancel();
    });
  }
);
