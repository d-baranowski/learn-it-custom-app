/// <reference types="cypress" />
import {
  ADAM_THERAPIST_OPTION,
  createTherapyViaForm,
  generateRandomString,
  setupTherapyTestForAdam,
  EXISTING_CUSTOMER,
} from './therapy-test-utils';
import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Therapy READ Tests — Non-Admin', () => {
  const existingCustomer = EXISTING_CUSTOMER;

  beforeEach(() => {
    setupTherapyTestForAdam();
  });

  it('THPY_E2E_20: should only see own therapies in grid', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Adam Therapy ${randomValue}`;

    const grid = new TherapyGrid();
    const navHelper = new NavigationHelper();

    createTherapyViaForm({
      displayName,
      therapistName: ADAM_THERAPIST_OPTION,
      customerNames: [existingCustomer],
    });

    navHelper.verifyBreadcrumb('Therapy');

    grid.getVisibleRows().then(($rows) => {
      cy.wrap($rows).each(($row) => {
        const rowText = $row.text();
        expect(rowText).to.match(/Adam|Hałaczkiewicz/);
      });
    });
  });

  it('THPY_E2E_21: should view own therapy details', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Adam View Therapy ${randomValue}`;
    const roomName = 'B1';

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    createTherapyViaForm({
      displayName,
      therapistName: ADAM_THERAPIST_OPTION,
      customerNames: [existingCustomer],
      roomName,
    });

    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.openRow(displayName);

    form.shouldHaveDisplayName(displayName);

    form.cancel();
    form.waitForFormClose();
  });

  it('THPY_E2E_22: should not see therapies created by other therapists', { tags: '@mutating' }, () => {
    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();
    const navHelper = new NavigationHelper();

    navHelper.logout();

    cy.login();

    navHelper.navigateToTherapy();

    const annaTherapyName = `Anna Therapy ${generateRandomString(6)}`;
    form.clickNew();

    form.fillDisplayName(annaTherapyName, false);
    form.selectTherapist('Anna Radecka');
    form.selectFirstService();

    form.selectCustomers([existingCustomer]);
    form.goToConfigurationTab();

    form.goToSessionFrequencyTab();
    form.clickAddSchedule();
    form.selectFirstFrequencyRoom();

    form.submitCreateAndClose();
    grid.search('filter-displayName', annaTherapyName);
    grid.waitForFetchSettled();
    grid.shouldContain(annaTherapyName);

    navHelper.logout();
    cy.login('jannowak', 'Password1!');
    navHelper.navigateToTherapy();

    grid.search('filter-displayName', annaTherapyName);
    grid.waitForFetchSettled();
    grid.shouldNotContain(annaTherapyName);
  });
});
