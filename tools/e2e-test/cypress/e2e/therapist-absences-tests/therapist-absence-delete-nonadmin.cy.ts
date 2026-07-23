/// <reference types="cypress" />

/**
 * TEST: TA_E2E_07 — Non-admin deletes their own absence
 *
 * Steps:
 * 1. Login as Adam, navigate to absence page
 * 2. Create an absence for Adam
 * 3. Select it and delete
 * 4. Confirm deletion
 * 5. Verify the row is gone from the grid
 */

import { setupAsAdam, makeAdamAbsence } from './therapist-absence-test-utils';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';

describe('Therapist Absences - Delete as non-admin', () => {
  beforeEach(() => {
    setupAsAdam();
  });

  it('TA_E2E_07: non-admin should delete their own absence', { tags: '@mutating' }, () => {
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();
    const absence = makeAdamAbsence();

    form.createAbsence(absence);
    grid.waitForGrid();
    grid.shouldContain(absence.reason);

    grid.getRowDataId(absence.reason).then((absenceId) => {
      grid.selectRow(absence.reason);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.shouldNotHaveRowWithId(absenceId);
    });
  });
});
