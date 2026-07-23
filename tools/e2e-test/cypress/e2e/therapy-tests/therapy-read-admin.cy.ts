/// <reference types="cypress" />
import {
  createTherapyViaForm,
  generateRandomString,
  setupTherapyTestForAdmin,
} from './therapy-test-utils';
import { uniqueEmail } from '../../utils/unique';
import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';

describe('Therapy READ Tests — Admin', () => {
  // Generated per-test (not at describe scope) so each test — and any retry —
  // creates its own customer against the shared, non-reset DB.
  let randomCustomerName: string;

  beforeEach(() => {
    randomCustomerName = 'Test Customer ' + generateRandomString(6);
    setupTherapyTestForAdmin(randomCustomerName, uniqueEmail('newcustomer'));
  });

  it('THPY_E2E_18: should view therapy details by double-clicking (READ)', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Test Therapy ${randomValue}`;
    const therapistName = 'Jan Nowak';
    const serviceName = 'Systemic Therapy';
    const roomName = 'B1';
    const sessionDuration = '50';
    const sessionPrice = '210';

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    createTherapyViaForm({
      displayName,
      therapistName,
      serviceName,
      customerNames: [randomCustomerName],
      roomName,
    });

    grid.openRow(displayName);

    form.shouldHaveDisplayName(displayName);

    form.goToConfigurationTab();
    form.shouldHaveSessionDuration(sessionDuration);
    form.shouldHaveSessionPrice(sessionPrice);

    form.goToSessionFrequencyTab();
    form.getFrequencyEvery().should('eq', '1');
    form.getFrequencyUnit().should('eq', 'Week');

    form.cancel();
    form.waitForFormClose();
  });

  it('THPY_E2E_19: should search and filter therapies', { tags: '@mutating' }, () => {
    const randomValue1 = generateRandomString(6);
    const randomValue2 = generateRandomString(6);
    const displayName1 = `Search Therapy ${randomValue1}`;
    const displayName2 = `Different Therapy ${randomValue2}`;
    const therapistName = 'Jan Nowak';
    const serviceName = 'Systemic Therapy';

    const grid = new TherapyGrid();

    createTherapyViaForm({
      displayName: displayName1,
      therapistName,
      serviceName,
      customerNames: [randomCustomerName],
    });

    createTherapyViaForm({
      displayName: displayName2,
      therapistName,
      serviceName,
      customerNames: [randomCustomerName],
    });

    grid.search('filter-displayName', displayName1);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName1);
    grid.shouldNotContain(displayName2);

    // Re-filter to the second therapy to prove it also exists (an unfiltered
    // "shows both" check is unreliable once the grid accumulates rows).
    grid.search('filter-displayName', displayName2);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName2);
    grid.shouldNotContain(displayName1);
  });
});
