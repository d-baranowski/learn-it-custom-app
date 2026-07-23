/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import { fillDateFilter } from '../session-tests/session-test-utils';
import {
  createTherapyWithFrequency,
  formatDDMMYYYY,
  generateSessionsViaPreview,
  getNextMonday,
  openTherapyToFrequencyTab,
} from '../therapy-tests/therapy-frequency-test-helpers';

describe('Session Generate — Extended — Unlock & Delete Future', () => {
  const nav = new NavigationHelper();
  const form = new TherapyFormComponent();
  const grid = new GridComponent();
  const gen = new SessionGenerateComponent();

  beforeEach(() => {
    cy.login();
  });

  it('SESGEN_E2E_07: unlock frequency deletes future sessions and enables frequency editing', { tags: '@mutating' }, () => {
    const nextMonday = getNextMonday();
    const twoWeeksLater = new Date(nextMonday);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromStr = formatDDMMYYYY(today);
    const untilStr = formatDDMMYYYY(twoWeeksLater);

    const name = createTherapyWithFrequency(nav, form, grid, {
      namePrefix: 'SesGenExt',
      startDate: nextMonday,
      endDate: twoWeeksLater,
    });

    openTherapyToFrequencyTab(grid, form, name);
    generateSessionsViaPreview(form, gen, fromStr, untilStr);

    cy.getByTestId('unlock-frequency-btn').should('be.visible');

    cy.getByTestId('unlock-frequency-btn').click();

    cy.get('[data-window-id="session-unlock-preview"]', {
      timeout: 15000,
    }).should('be.visible');

    cy.getByTestId('session-generate-unlock-warning').should('be.visible');
    cy.getByTestId('session-generate-unlock-warning').should(
      'contain.text',
      'All future generated sessions will be deleted'
    );

    cy.get('[data-testid="session-generate-summary-text"]', {
      timeout: 30000,
    }).should('contain.text', 'will be deleted');

    cy.get('[data-window-id="session-unlock-preview"]')
      .find('[data-testid="session-generate-confirm-btn"]')
      .should('contain.text', 'Delete & Unlock');

    cy.get('[data-window-id="session-unlock-preview"]')
      .find('[data-testid="session-generate-confirm-btn"]')
      .click();

    cy.get('[data-window-id="session-unlock-preview"]', {
      timeout: 10000,
    }).should('not.exist');

    cy.getByTestId('unlock-frequency-btn').should('not.exist');
    cy.contains('Schedule unlocked').should('be.visible');

    form.cancel();
    form.waitForFormClose();
  });

  it('SESGEN_E2E_08: delete future sessions removes generated sessions', { tags: '@mutating' }, () => {
    const nextMonday = getNextMonday();
    const twoWeeksLater = new Date(nextMonday);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const fromStr = formatDDMMYYYY(nextMonday);
    const untilStr = formatDDMMYYYY(twoWeeksLater);

    const name = createTherapyWithFrequency(nav, form, grid, {
      namePrefix: 'SesGenExt',
      startDate: nextMonday,
      endDate: twoWeeksLater,
    });

    openTherapyToFrequencyTab(grid, form, name);
    generateSessionsViaPreview(form, gen, fromStr, untilStr);

    form.cancel();
    form.waitForFormClose();

    nav.navigateToSession();
    fillDateFilter('date-from', fromStr);
    cy.get('body').click(0, 0);
    grid.shouldContain('Adam');

    nav.navigateToTherapy();
    openTherapyToFrequencyTab(grid, form, name);

    cy.getByTestId('form-actions-dropdown-btn').click();
    cy.getByTestId('delete-future-sessions-btn').click();

    cy.get('[data-window-id="session-delete-future-preview"]', {
      timeout: 15000,
    }).should('be.visible');

    cy.getByTestId('session-generate-unlock-warning').should('be.visible');

    cy.get('[data-testid="session-generate-summary-text"]', {
      timeout: 30000,
    }).should('contain.text', 'will be deleted');

    cy.get('[data-window-id="session-delete-future-preview"]')
      .find('[data-testid="session-generate-confirm-btn"]')
      .click();

    cy.get('[data-window-id="session-delete-future-preview"]', {
      timeout: 10000,
    }).should('not.exist');

    form.cancel();
    form.waitForFormClose();

    nav.navigateToSession();
    fillDateFilter('date-from', fromStr);
    cy.get('body').click(0, 0);

    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 15000,
    }).should('exist');

    cy.get('[data-testid="rpg-grid-component-wrapper"]').then(($wrapper) => {
      const hasNoRows =
        $wrapper.find('.MuiTableBody-root tr').length === 0 ||
        $wrapper.text().includes('No records');
      const hasNoAdam = !$wrapper.text().includes('Adam');
      expect(hasNoRows || hasNoAdam).to.be.true;
    });
  });
});
