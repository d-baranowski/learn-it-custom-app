/// <reference types="cypress" />

import { SessionFormComponent } from '../components-objects/session-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { getTomorrowFormatted } from '../../utils/date-utils';
import { uniquePrice } from '../../utils/unique';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;
export const ADAM_THERAPIST_OPTION =
  'Adam Hałaczkiewicz - CBT Therapist (in training)';
export const MARTA_THERAPIST_OPTION =
  'Dr. Marta Kuczek - Cognitive Behavioral Therapist';

// Bootstrap therapies shown in the session form's Therapy dropdown.
export const ADAM_THERAPY_OPTION = 'Cognitive Behavioral Therapy';
export const MARTA_THERAPY_OPTION = 'Cognitive Behavioral Therapy';

// ── Date helpers ─────────────────────────────────────────────────────────────

export { getTomorrowFormatted };

// ── Login helpers ────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

// ── Session creation helpers ─────────────────────────────────────────────────

export interface SessionCreateOptions {
  therapyText?: string;
  therapistText?: string;
  /** Use the "Select Myself" button instead of the therapist autocomplete. */
  useSelfSelectTherapist?: boolean;
  displayName?: string;
  roomText: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  price: string;
  customerTexts?: string[];
}

/**
 * Create a session via the Session form.
 * Assumes the Session grid page is already open.
 */
export function createSessionViaForm(options: SessionCreateOptions): void {
  cylog('create session via form');
  const form = new SessionFormComponent();
  const grid = new GridComponent();

  form.clickNew();
  form.waitForFormLoad();

  if (options.useSelfSelectTherapist) {
    form.selectMyselfAsTherapist();
  } else if (options.therapistText) {
    form.selectTherapist(options.therapistText);
  }
  if (options.therapyText) {
    form.selectTherapy(options.therapyText);
  }
  form.selectRoom(options.roomText);
  if (options.customerTexts && options.customerTexts.length > 0) {
    form.selectCustomers(options.customerTexts);
  }
  if (options.displayName) {
    form.fillDisplayName(options.displayName);
  }
  form.fillStartDateTime(options.startDate, options.startTime);
  form.fillEndDateTime(options.endDate, options.endTime);
  form.fillPrice(options.price);

  form.submit();
  form.waitForFormClose();
  grid.waitForGrid();
}

/**
 * Fill a date-range filter input with a given date (DD/MM/YYYY).
 *
 * @param testId   The `data-testid` value (e.g. `"date-from"`)
 * @param dateFormatted  Date string in DD/MM/YYYY format
 * @param scope    Optional CSS scope prefix (e.g. `'[data-form-entity="therapy"]'`)
 */
export function fillDateFilter(
  testId: string,
  dateFormatted: string,
  scope?: string,
): void {
  cylog('fill date filter');
  const sel = scope
    ? `${scope} input[data-testid="${testId}"]`
    : `input[data-testid="${testId}"]`;

  typeDateIntoFilter(sel, dateFormatted);

  cy.get(sel)
    .invoke('val')
    .then((val) => {
      if (val !== dateFormatted) {
        typeDateIntoFilter(sel, dateFormatted);
        cy.get(sel)
          .invoke('val')
          .then((val2) => {
            if (val2 !== dateFormatted) {
              typeDateIntoFilter(sel, dateFormatted);
            }
          });
      }
    });
}

function typeDateIntoFilter(sel: string, dateFormatted: string): void {
  const [dd, mm, yyyy] = dateFormatted.split('/');

  cy.get(sel).click({ force: true });
  // MUI DatePicker sectioned input: ArrowLeft x5 jumps to the DD section,
  // then type each section separately — MUI auto-advances after 2 digits.
  // {selectall} does NOT work here (it only selects within one section).
  cy.get(sel).type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}', {
    force: true,
  });
  cy.get(sel).type(dd, { force: true, delay: 100 });
  cy.get(sel).type(mm, { force: true, delay: 100 });
  cy.get(sel).type(yyyy, { force: true, delay: 100 });
  // Dismiss any calendar popup
  cy.get(sel).type('{esc}', { force: true });
}

/**
 * Restrict the session grid to exactly tomorrow's sessions by setting
 * both date-from and date-to to tomorrow.
 *
 * Setting only date-from (GTE) leaves the upper bound open, which causes
 * bootstrap sessions on later days to appear in the grid and collide with
 * test sessions that share the same price (e.g. Katarzyna Thu price 250).
 */
export function adjustDateFiltersForTomorrow(): void {
  const tomorrow = getTomorrowFormatted();

  cy.get('body').click(0, 0);

  fillDateFilter('date-from', tomorrow);
  fillDateFilter('date-to', tomorrow);

  cy.get('body').click(0, 0);
  cy.get('[data-testid="rpg-grid-component-wrapper"]', {
    timeout: 15000,
  }).should('exist');
}

// ── Setup functions ──────────────────────────────────────────────────────────

/** Reset DB, login as admin, navigate to Session page */
export function setupSessionTestForAdmin(): void {
  cylog('setup session test for admin');
  setupFor('admin', (nav) => nav.navigateToSession());
}

/** Reset DB, login as Adam, navigate to Session page */
export function setupSessionTestForAdam(): void {
  cylog('setup session test for adam');
  setupFor('adam', (nav) => nav.navigateToSession());
}

/** Per-run unique prices identifying the two sessions created by the setup. */
export interface TwoSessionPrices {
  adamPrice: string;
  martaPrice: string;
}

/**
 * Admin creates 2 sessions (Adam's tomorrow 10:00 + Marta's 11:00) with
 * per-run unique prices (returned) so callers can identify each row among
 * tomorrow's accumulating sessions on the non-reset DB.
 * Ends on the Session grid page logged in as admin with date filters adjusted.
 */
export function setupAdminWithTwoSessions(): TwoSessionPrices {
  cylog('setup admin with two sessions');
  const tomorrow = getTomorrowFormatted();
  const adamPrice = String(uniquePrice());
  const martaPrice = String(uniquePrice());

  setupFor('admin', (nav) => nav.navigateToSession());

  // Create Adam's session: tomorrow 10:00-10:50
  createSessionViaForm({
    therapyText: ADAM_THERAPY_OPTION,
    therapistText: ADAM_THERAPIST_OPTION,
    roomText: 'B1',
    startDate: tomorrow,
    startTime: '10:00',
    endDate: tomorrow,
    endTime: '10:50',
    price: adamPrice,
  });

  // Create Marta's session: tomorrow 11:00-11:50
  createSessionViaForm({
    therapyText: MARTA_THERAPY_OPTION,
    therapistText: MARTA_THERAPIST_OPTION,
    roomText: 'B2',
    startDate: tomorrow,
    startTime: '11:00',
    endDate: tomorrow,
    endTime: '11:50',
    price: martaPrice,
  });

  adjustDateFiltersForTomorrow();

  return { adamPrice, martaPrice };
}

/** Prices for the four-session state produced by setupThreeSessionsWithAdamEdits. */
export interface ThreeSessionPrices {
  /** Marta's session (unchanged from setupAdminWithTwoSessions). */
  martaPrice: string;
  /** Adam's own T7 session. */
  adamOwnPrice: string;
  /** Adam's first session after he edits it (B1→T5, new price). */
  adamEditedPrice: string;
}

/**
 * Full state for SES_E2E_04: admin creates 2 sessions, Adam creates a 3rd and
 * edits the 1st. All prices are per-run unique and returned so callers can
 * target each row unambiguously.
 * Ends on the Session grid page logged in as admin with date filters adjusted.
 */
export function setupThreeSessionsWithAdamEdits(): ThreeSessionPrices {
  cylog('setup three sessions with adam edits');
  const { adamPrice, martaPrice } = setupAdminWithTwoSessions();

  // Switch to Adam
  setupFor('adam', (nav) => nav.navigateToSession());
  adjustDateFiltersForTomorrow();

  const tomorrow = getTomorrowFormatted();
  const adamOwnPrice = String(uniquePrice());
  const adamEditedPrice = String(uniquePrice());

  // Adam creates his own session: tomorrow 14:00-14:50
  // Therapy is skipped — Adam has no therapy options in the autocomplete.
  // Therapist must still be selected (required field).
  createSessionViaForm({
    therapistText: ADAM_THERAPIST_OPTION,
    roomText: 'T7',
    startDate: tomorrow,
    startTime: '14:00',
    endDate: tomorrow,
    endTime: '14:50',
    price: adamOwnPrice,
  });

  // Adam edits his first session (identified by its unique price): B1 -> T5,
  // price -> adamEditedPrice.
  adjustDateFiltersForTomorrow();
  const grid = new GridComponent();
  const form = new SessionFormComponent();
  grid.openRow(adamPrice, true);
  form.waitForFormLoad();
  form.selectRoom('T5');
  form.fillPrice(adamEditedPrice);
  form.submit();
  form.waitForFormClose();
  grid.waitForGrid();

  // Switch back to admin
  setupFor('admin', (nav) => nav.navigateToSession());
  adjustDateFiltersForTomorrow();

  return { martaPrice, adamOwnPrice, adamEditedPrice };
}
