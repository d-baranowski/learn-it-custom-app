/// <reference types="cypress" />

/**
 * TEST: TA_E2E_02 — Admin creates an org-wide (global) absence
 *
 * Steps:
 * 1. Login as admin, navigate to absence page
 * 2. Create an absence WITHOUT therapist (org-wide)
 * 3. Verify it appears in the grid
 *
 * TA_E2E_01 (therapist-specific create) was removed — TA_E2E_06 re-executes
 * the identical create chain as its setup, and the submit-gating assertions
 * live in TA_VAL_E2E. The org-wide (no therapist) variant here is the only
 * create path not covered elsewhere.
 */

import {
  setupAsAdmin,
  makeGlobalAbsence,
  navigateToAbsencePage,
} from './therapist-absence-test-utils';
import { AbsenceFormComponent } from '../components-objects/absence-form.component';
import { GridComponent } from '../components-objects/grid.component';

describe('Therapist Absences - Create as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('TA_E2E_02: should create a global/org-wide absence (no therapist)', { tags: '@mutating' }, () => {
    const form = new AbsenceFormComponent();
    const grid = new GridComponent();
    const absence = makeGlobalAbsence();

    form.createAbsence(absence);

    navigateToAbsencePage();
    grid.shouldContain(absence.reason);
  });
});
