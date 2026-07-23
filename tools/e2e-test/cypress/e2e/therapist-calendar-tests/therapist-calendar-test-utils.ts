/// <reference types="cypress" />

import { cylog } from '../../utils/cylog';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import {
  formatDateISO,
  getLastWeekday as getLastWeekdayBeforeToday,
} from '../../utils/date-utils';

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;
export const ADAM_ABBREVIATION = ADAM.abbreviation;

// Calendar headers now display abbreviations instead of full names
export const THERAPIST_ABBREVIATIONS = ['AH', 'AK1', 'AKB', 'AR', 'AS', 'JN'];

// ── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Return the most recent weekday (Mon-Fri).
 * If today is a weekday, returns today. If Saturday, returns Friday.
 * If Sunday, returns the previous Friday.
 * Bootstrap seeds sessions for weekdays only, so this guarantees data.
 */
export function getLastWeekday(): Date {
  cylog('get last weekday');
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const d = isWeekend ? getLastWeekdayBeforeToday() : today;
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format Date as YYYY-MM-DD (URL parameter format). */
export const formatISO = formatDateISO;

// ── Login helpers ────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  cylog('login as admin');
  loginAs('admin');
}

export function loginAsAdam(): void {
  cylog('login as adam');
  loginAs('adam');
}

// ── Setup helpers ────────────────────────────────────────────────────────────

/**
 * Login as admin and navigate to Therapist Calendar day view.
 * When `dateISO` is provided (YYYY-MM-DD), navigates to that specific date.
 * Otherwise navigates to the most recent weekday to guarantee bootstrap data.
 */
export function setupTherapistCalendarForAdmin(dateISO?: string): void {
  cylog('setup therapist calendar for admin');
  const date = dateISO ?? formatISO(getLastWeekday());
  setupFor('admin', (nav) => nav.navigateToTherapistCalendar(date));
}

export function setupTherapistCalendarForAdam(dateISO?: string): void {
  cylog('setup therapist calendar for adam');
  const date = dateISO ?? formatISO(getLastWeekday());
  setupFor('adam', (nav) => nav.navigateToTherapistCalendar(date));
}
