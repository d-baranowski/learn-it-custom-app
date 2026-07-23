/// <reference types="cypress" />

import {
  setupSessionTestForAdmin,
  createSessionViaForm,
  ADAM_THERAPIST_OPTION,
} from './session-test-utils';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { ToastComponent } from '../components-objects/toast.component';
import { getDateFromToday, formatDDMMYYYY } from '../../utils/date-utils';
import { uniquePrice } from '../../utils/unique';

describe('Session - Find Available Room — All Rooms Occupied', () => {
  const form = new SessionFormComponent();

  before(() => {
    setupSessionTestForAdmin();
  });

  it('SES_FAR_E2E_04: shows error toast when no rooms available', { tags: '@mutating' }, () => {
    // Saturate every room at ONE slot, then verify no room is available. The
    // slot must be pristine, so pick a far-future weekday unique to this run —
    // reusing a fixed date would find the rooms already booked by a prior run
    // against the non-reset DB (and re-creating would double-book).
    const target = getDateFromToday(400 + Math.floor(Math.random() * 400));
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
    }
    const slotDate = formatDDMMYYYY(target);
    const price = String(uniquePrice());

    const rooms = ['B1', 'B2', 'B3', 'B4', 'T5', 'T6', 'T7'];
    rooms.forEach((room) => {
      createSessionViaForm({
        therapistText: ADAM_THERAPIST_OPTION,
        roomText: room,
        startDate: slotDate,
        startTime: '15:00',
        endDate: slotDate,
        endTime: '15:50',
        price,
      });
    });

    form.clickNew();
    form.waitForFormLoad();

    form.fillDate(slotDate);
    form.fillStartTime('15:00');
    form.fillEndTime('15:50');

    form.clickFindAvailableRoom();

    new ToastComponent().expectError('No available rooms');

    form.cancel();
  });
});
