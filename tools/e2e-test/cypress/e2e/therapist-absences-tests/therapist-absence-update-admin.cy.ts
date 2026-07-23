/// <reference types="cypress" />

/**
 * TEST: TA_E2E_04 — Admin updates an existing absence
 *
 * Steps:
 * 1. Login as admin, navigate to absence page
 * 2. Double-click an existing row to open edit form
 * 3. Update the reason field
 * 4. Save — verify the updated reason shows in the grid
 */

import { setupAsAdmin, makeUpdatedReason } from './therapist-absence-test-utils';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';

describe('Therapist Absences - Update as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('TA_E2E_04: should update an existing absence', { tags: '@mutating' }, () => {
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const updatedReason = makeUpdatedReason();

    grid.openFirstRow();
    form.waitForFormLoad();
    form.waitForFormPopulated();

    form.fillReason(updatedReason);
    form.shouldBeSubmitEnabled();

    form.clickSave();
    form.waitForFormClose();

    grid.shouldContain(updatedReason);
  });
});
