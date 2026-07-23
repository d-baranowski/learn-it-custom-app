/// <reference types="cypress" />

/**
 * UTR-000166 — Therapy Session Frequency conditional lock.
 *
 * Frequency edits are locked only when today falls between the therapy's
 * sessions_generated_at and sessions_generated_till timestamps. A therapy
 * that has never had sessions generated is freely editable.
 *
 * Tests:
 * 01 — Never-generated therapy is unlocked on reopen
 * 02 — Generating sessions covering today locks the frequency on reopen
 * 03 — Generating only future sessions (window starts in the future)
 *      leaves frequency unlocked
 */

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import {
  createTherapyWithFrequency,
  openTherapyToFrequencyTab,
  formatDDMMYYYY,
} from './therapy-frequency-test-helpers';

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function nextMondayOnOrAfter(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  while (next.getDay() !== 1) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function shouldBeUnlocked(): void {
  cy.get('[data-testid="unlock-frequency-btn"]').should('not.exist');
  cy.get('[data-testid="session-frequency-add-schedule"]').should(
    'not.be.disabled'
  );
}

function shouldBeLocked(): void {
  cy.get('[data-testid="unlock-frequency-btn"]').should('be.visible');
  cy.get('[data-testid="session-frequency-add-schedule"]').should('be.disabled');
}

describe(
  'Therapy Session Frequency conditional lock (UTR-000166)',
  () => {
    const nav = new NavigationHelper();
    const form = new TherapyFormComponent();
    const grid = new GridComponent();
    const gen = new SessionGenerateComponent();

    beforeEach(() => {
      cy.login();
    });

    it('THPY_FREQLOCK_E2E_01: never-generated therapy is unlocked on reopen', { tags: '@mutating' }, () => {
      const today = new Date();
      const start = nextMondayOnOrAfter(addDays(today, 1));
      const end = addDays(start, 90);
      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'FreqLock',
        startDate: start,
        endDate: end,
      });

      // No sessions generated — reopen and verify frequency is editable.
      openTherapyToFrequencyTab(grid, form, name);
      shouldBeUnlocked();
    });

    it('THPY_FREQLOCK_E2E_02: generating sessions across today locks the frequency on reopen', { tags: '@mutating' }, () => {
      const today = new Date();
      // Therapy starts on next Monday so generation produces real rows.
      const start = nextMondayOnOrAfter(addDays(today, 1));
      const end = addDays(start, 90);
      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'FreqLock',
        startDate: start,
        endDate: end,
      });

      // Generate sessions with a window that includes today.
      openTherapyToFrequencyTab(grid, form, name);
      form.clickGenerateSessions();
      gen.waitForWindow();
      gen.fillFromDate(formatDDMMYYYY(today));
      gen.fillUntilDate(formatDDMMYYYY(addDays(start, 28)));
      gen.clickPreview();
      gen.shouldHaveSummary('will be created');
      gen.shouldShowTable();
      gen.clickConfirm();
      gen.waitForWindowClose();

      // Close and reopen — fresh fetch should report today inside the window.
      form.cancel();
      grid.waitForGrid();
      openTherapyToFrequencyTab(grid, form, name);
      shouldBeLocked();
    });

    it('THPY_FREQLOCK_E2E_03: generating only future sessions leaves frequency unlocked', { tags: '@mutating' }, () => {
      const today = new Date();
      // Push the therapy start (and the generation window) well into the future
      // so the saved [generatedAt, generatedTill] range does NOT include today.
      const start = nextMondayOnOrAfter(addDays(today, 30));
      const end = addDays(start, 90);
      const name = createTherapyWithFrequency(nav, form, grid, {
        namePrefix: 'FreqLock',
        startDate: start,
        endDate: end,
      });

      openTherapyToFrequencyTab(grid, form, name);
      form.clickGenerateSessions();
      gen.waitForWindow();
      // From-date set to the therapy's future start so the persisted
      // sessions_generated_at sits in the future too.
      gen.fillFromDate(formatDDMMYYYY(start));
      gen.fillUntilDate(formatDDMMYYYY(addDays(start, 28)));
      gen.clickPreview();
      gen.shouldHaveSummary('will be created');
      gen.shouldShowTable();
      gen.clickConfirm();
      gen.waitForWindowClose();

      form.cancel();
      grid.waitForGrid();
      openTherapyToFrequencyTab(grid, form, name);
      shouldBeUnlocked();
    });
  }
);
