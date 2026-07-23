/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';
import { ADAM } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { GridComponent } from '../components-objects/grid.component';
import { uniqueToken } from '../../utils/unique';

export const ADAM_DISPLAY_NAME = ADAM.fullName;

export interface AbsenceData {
  therapistName?: string;
  fromTime: string;
  tillTime: string;
  reason: string;
}

/**
 * A pseudo-unique absence date/time (DDMMYYYYHHmm, no separators). Varies the
 * day and minute per call so absences created across runs against the non-reset
 * DB don't overlap on the same therapist/slot.
 */
function uniqueAbsenceSlot(): { fromTime: string; tillTime: string } {
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return {
    fromTime: `${day}03202708${minute}`,
    tillTime: `${day}03202717${minute}`,
  };
}

/** Reason for an updated absence, unique to this run. */
export function makeUpdatedReason(): string {
  return `Updated reason ${uniqueToken()}`;
}

/** Navigate to the absence list page (optionally under a locale prefix) */
export function navigateToAbsencePage(langCode: string = 'en'): void {
  cylog('navigate to absence page');
  const prefix = langCode === 'en' ? '' : `/${langCode}`;
  cy.visit(`${prefix}/core/absence`);
  new GridComponent().waitForGrid();
}

/** Login as admin and navigate to the absence page. */
export function setupAsAdmin(): void {
  setupFor('admin', () => navigateToAbsencePage());
}

/** Login as Adam (non-admin) and navigate to the absence page. */
export function setupAsAdam(): void {
  setupFor('adam', () => navigateToAbsencePage());
}

/** Valid absence for a specific therapist, unique to this run. */
export function makeTherapistAbsence(): AbsenceData {
  return {
    therapistName: ADAM_DISPLAY_NAME,
    ...uniqueAbsenceSlot(),
    reason: `E2E therapist sick leave ${uniqueToken()}`,
  };
}

/** Global/org-wide absence (no therapist), unique to this run. */
export function makeGlobalAbsence(): AbsenceData {
  return {
    ...uniqueAbsenceSlot(),
    reason: `E2E org-wide day off ${uniqueToken()}`,
  };
}

/** An Adam-owned absence, unique to this run (for non-admin specs). */
export function makeAdamAbsence(): AbsenceData {
  return {
    therapistName: ADAM_DISPLAY_NAME,
    ...uniqueAbsenceSlot(),
    reason: `E2E Adam absence ${uniqueToken()}`,
  };
}
