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

describe('Session Generate — Extended — Exclude', () => {
  const nav = new NavigationHelper();
  const form = new TherapyFormComponent();
  const grid = new GridComponent();
  const gen = new SessionGenerateComponent();

  before(() => {
    cy.login();
  });

  it('SESGEN_E2E_06: excluding sessions reduces selected count and prevents their generation', { tags: '@mutating' }, () => {
    const nextMonday = getNextMonday();
    const threeWeeksLater = new Date(nextMonday);
    threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

    const name = createTherapyWithFrequency(nav, form, grid, {
      namePrefix: 'SesGenExt',
      startDate: nextMonday,
      endDate: threeWeeksLater,
    });

    openTherapyToFrequencyTab(grid, form, name);
    form.clickGenerateSessions();
    gen.waitForWindow();

    gen.fillFromDate(formatDDMMYYYY(nextMonday));
    gen.fillUntilDate(formatDDMMYYYY(threeWeeksLater));

    gen.clickPreview();
    gen.shouldHaveSummary('will be created');
    gen.shouldShowTable();

    cy.get('[data-testid="session-generate-summary-text"]')
      .invoke('text')
      .then((summaryText) => {
        const match = summaryText.match(/(\d+)\s+session/);
        const initialCount = match ? parseInt(match[1], 10) : 0;
        expect(initialCount).to.be.greaterThan(1);

        cy.get('[data-testid="session-generate-preview-table"]')
          .find('input[type="checkbox"]')
          .first()
          .click();

        gen.shouldHaveSummary(`${initialCount - 1} session`);
      });

    gen.clickConfirm();
    gen.waitForWindowClose();

    form.cancel();

    nav.navigateToSession();
    fillDateFilter('date-from', formatDDMMYYYY(nextMonday));
    cy.get('body').click(0, 0);

    cy.get('[data-testid="rpg-grid-component-wrapper"]').should('exist');
    grid.shouldContain('Adam');
    grid.shouldContain('B1');
  });
});
