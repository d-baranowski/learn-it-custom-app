/// <reference types="cypress" />

/**
 * TEST: TA_E2E_05 — Non-admin updates their own absence
 *
 * Steps:
 * 1. Login as Adam, navigate to absence page
 * 2. First create an absence for Adam
 * 3. Open the created row to edit
 * 4. Update the reason
 * 5. Save — verify the updated reason shows in the grid
 */

import {
  setupAsAdam,
  makeAdamAbsence,
  makeUpdatedReason,
} from './therapist-absence-test-utils';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';

describe('Therapist Absences - Update as non-admin', () => {
  beforeEach(() => {
    setupAsAdam();
  });

  it('TA_E2E_05: non-admin should update their own absence', { tags: '@mutating' }, () => {
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const absence = makeAdamAbsence();
    const updatedReason = makeUpdatedReason();

    form.createAbsence(absence);
    grid.waitForGrid();
    grid.shouldContain(absence.reason);

    grid.openRow(absence.reason);
    form.waitForFormLoad();
    form.waitForFormPopulated();

    form.fillReason(updatedReason);
    form.shouldBeSubmitEnabled();

    form.clickSave();
    form.waitForFormClose();

    grid.waitForGrid();
    grid.shouldContain(updatedReason);
  });
});
