/// <reference types="cypress" />

import { NavigationHelper } from '../components-objects/navigation.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';
import { generateRandomString } from './therapy-test-utils';
import { cylog } from '../../utils/cylog';

export function getNextMonday(): Date {
  cylog('get next monday');
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatMMDDYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export interface CreateTherapyOptions {
  therapyName?: string;
  startDate?: Date;
  endDate?: Date;
  price?: string;
  namePrefix?: string;
}

export function createTherapyWithFrequency(
  nav: NavigationHelper,
  form: TherapyFormComponent,
  grid: GridComponent,
  options?: CreateTherapyOptions
): string {
  cylog('create therapy with frequency');
  const prefix = options?.namePrefix ?? 'PriceUpd';
  const name = options?.therapyName || `${prefix} ${generateRandomString(5)}`;
  const nextMonday = options?.startDate || getNextMonday();
  const endDate =
    options?.endDate ||
    (() => {
      const d = new Date(nextMonday);
      d.setDate(d.getDate() + 28);
      return d;
    })();

  nav.navigateToTherapy();

  form.clickNew();

  form.fillBasicInfo({
    displayName: name,
    therapistName: 'Adam',
    serviceName: 'Cognitive Behavioral Therapy',
    customerNames: ['Johnson Mike'],
  });

  form.goToConfigurationTab();
  cy.get('input[data-testid="start-date"]').click();
  cy.get('input[data-testid="start-date"]').type(
    `{selectall}${formatMMDDYYYY(nextMonday)}`,
    { delay: 80 }
  );
  cy.get('input[data-testid="end-date"]').click();
  cy.get('input[data-testid="end-date"]').type(
    `{selectall}${formatMMDDYYYY(endDate)}`,
    { delay: 80 }
  );

  if (options?.price) {
    form.fillSessionPrice(options.price);
  }

  form.goToSessionFrequencyTab();
  form.clickAddSchedule();
  form.selectFrequencyRoom('B1');
  form.selectFrequencyUnit('Week');
  form.toggleFrequencyDay('M');
  form.setFrequencyStartTime('10:00');

  form.submitCreateAndClose();
  grid.waitForGrid();
  // Filter to this therapy before asserting — the grid accumulates rows without
  // a DB reset and a freshly-created row can paginate off page 1.
  grid.search('filter-displayName', name);
  grid.waitForFetchSettled();
  grid.shouldContain(name);
  grid.clearSearch('filter-displayName');
  grid.waitForFetchSettled();

  return name;
}

export function openTherapyToFrequencyTab(
  grid: GridComponent,
  form: TherapyFormComponent,
  therapyName: string
): void {
  cylog('open therapy to frequency tab');
  // Filter to the therapy before locating its row — the grid accumulates rows
  // without a DB reset and the target can paginate off page 1.
  grid.search('filter-displayName', therapyName);
  grid.waitForFetchSettled();
  grid.findRow(therapyName).scrollIntoView().dblclick({ force: true });
  form.waitForFormLoad();
  form.goToSessionFrequencyTab();
}

export function generateSessionsViaPreview(
  form: TherapyFormComponent,
  gen: SessionGenerateComponent,
  fromDate: string,
  untilDate: string
): void {
  cylog('generate sessions via preview');
  form.clickGenerateSessions();
  gen.waitForWindow();

  gen.fillFromDate(fromDate);
  gen.fillUntilDate(untilDate);

  gen.waitForSessionList();
  gen.shouldBeConfirmEnabled();

  gen.clickConfirm();
  gen.waitForWindowClose();
}
