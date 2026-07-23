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

describe('Therapy UPDATE Tests (Non-Admin)', () => {
  beforeEach(() => {
    setupTherapyTestForAdam();
  });

  it('THPY_E2E_23: should update own therapy (UPDATE)', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Adam Therapy ${randomValue}`;
    const roomName = 'B1';

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    createTherapyViaForm({
      displayName,
      therapistName: ADAM_THERAPIST_OPTION,
      customerNames: [EXISTING_CUSTOMER],
      roomName,
    });

    const updatedDisplayName = `Modified Therapy ${randomValue}`;
    const updatedRoomName = 'B2';
    const updatedSessionDuration = '60';
    const updatedSessionPrice = '250';

    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.openRow(displayName);

    form.waitForFormLoad();
    form.shouldHaveDisplayName(displayName);

    form.fillDisplayName(updatedDisplayName);

    form.goToSessionFrequencyTab();
    form.selectFrequencyRoom(updatedRoomName);

    form.goToConfigurationTab();

    form.fillSessionDuration(updatedSessionDuration);

    form.fillSessionPrice(updatedSessionPrice);

    form.submit();
    form.waitForFormClose();

    grid.search('filter-displayName', updatedDisplayName);
    grid.waitForFetchSettled();
    grid.shouldContain(updatedDisplayName);
    grid.shouldNotContain(displayName);
  });

  it('THPY_E2E_24: should verify therapist field is limited to current user', { tags: '@mutating' }, () => {
    const randomValue = generateRandomString(6);
    const displayName = `Adam Therapy ${randomValue}`;

    const grid = new TherapyGrid();
    const form = new TherapyFormComponent();

    createTherapyViaForm({
      displayName,
      therapistName: ADAM_THERAPIST_OPTION,
      customerNames: [EXISTING_CUSTOMER],
    });

    grid.search('filter-displayName', displayName);
    grid.waitForFetchSettled();
    grid.openRow(displayName);

    form.getTherapistOptionCount().then((count) => {
      expect(count).to.equal(1);
    });

    form.cancel();
  });
});
