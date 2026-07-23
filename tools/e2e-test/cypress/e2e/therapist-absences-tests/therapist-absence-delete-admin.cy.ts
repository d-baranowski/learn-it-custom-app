/// <reference types="cypress" />

/**
 * TEST: TA_E2E_06 — Admin deletes an absence
 *
 * Steps:
 * 1. Login as admin, navigate to absence page
 * 2. First create an absence
 * 3. Select it and delete
 * 4. Confirm deletion
 * 5. Verify the row is gone from the grid
 */

import { setupAsAdmin, makeTherapistAbsence } from './therapist-absence-test-utils';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';

describe('Therapist Absences - Delete as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('TA_E2E_06: should delete an absence', { tags: '@mutating' }, () => {
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const deleteDialog = new DeleteDialog();
    const absence = makeTherapistAbsence();

    form.createAbsence(absence);
    grid.shouldContain(absence.reason);

    grid.getRowDataId(absence.reason).then((absenceId) => {
      grid.selectRow(absence.reason);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.shouldNotHaveRowWithId(absenceId);
    });
  });
});
