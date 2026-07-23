/// <reference types="cypress" />
import { generateRandomString, setupTherapyTestForAdmin } from './therapy-test-utils';
import { uniqueEmail } from '../../utils/unique';
import { GridComponent as TherapyGrid } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';

describe('Therapy CREATE — Happy Path (Admin)', () => {
  let randomCustomerName: string;
  beforeEach(() => {
    randomCustomerName = 'Test Customer ' + generateRandomString(6);
    setupTherapyTestForAdmin(randomCustomerName, uniqueEmail('newcustomer'));
  });

  it('THPY_E2E_05: should create a new therapy and update it.', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);

    const displayName = `Test Therapy ${randomValue}`;
    const therapistName = 'Jan Nowak';
    const serviceName = 'Systemic Therapy';
    const roomName = 'B1';
    const today = new Date();

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const formattedStartDate = `${dd}/${mm}/${yyyy}`;

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    form.clickNew();

    form.fillDisplayName(displayName, false);

    form.selectTherapist(therapistName);

    form.selectService(serviceName);

    form.selectCustomers([randomCustomerName]);

    form.goToConfigurationTab();

    form.getStartDate().should('eq', formattedStartDate);

    form.getEndDate().should('eq', '');

    form.getSessionDuration().should('eq', '50');

    form.getSessionPrice().should('eq', '210');

    form.goToSessionFrequencyTab();

    form.clickAddSchedule();
    form.selectFrequencyRoom(roomName);

    form
      .getFrequencyEvery()
      .should('eq', '1');
    form
      .getFrequencyUnit()
      .should('eq', 'Week');
    form.getFrequencyStartTime().should('eq', '09:00');

    form.submitCreateAndClose();

    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.shouldContain(displayName);

    grid.openRow(displayName);

    form.waitForFormLoad();
    form.shouldHaveDisplayName(displayName);


    const updatedDisplayName = `Updated Therapy ${randomValue}`;
    const updatedRoomName = 'B2';
    const updatedSessionDuration = '60';
    const updatedSessionPrice = '250';

    form.fillDisplayName(updatedDisplayName);

    form.goToSessionFrequencyTab();
    form.selectFrequencyRoom(updatedRoomName);

    form.goToConfigurationTab();

    form.fillSessionDuration(updatedSessionDuration);

    form.fillSessionPrice(updatedSessionPrice);

    form.submit();
    form.cancel();

    grid.search('filter-displayName', updatedDisplayName);
    grid.waitForFetchSettled();
    grid.shouldContain(updatedDisplayName);
    grid.shouldNotContain(displayName);
  });
});
