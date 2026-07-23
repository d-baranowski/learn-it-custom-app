import { MAX_MONTHS } from './types';

/**
 * Parse a JSON-encoded multilingual label string, returning the value
 * for the requested locale with fallbacks.
 */
export function parseTranslatedLabel(
  jsonLabel: string | undefined,
  locale: string
): string {
  if (!jsonLabel) return '-';
  try {
    const parsed = JSON.parse(jsonLabel);
    if (
      parsed &&
      typeof parsed === 'object' &&
      ('en' in parsed || 'pl' in parsed || 'vi' in parsed)
    ) {
      return parsed[locale] || parsed.en || parsed.pl || parsed.vi || jsonLabel;
    }
  } catch {
    // Not JSON, return as-is
  }
  return jsonLabel;
}

/** Format a date string (YYYY-MM-DD) and time string (HH:mm) as a locale date-time string. */
export function formatDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toLocaleString();
}

/** Return the localised weekday name for a date string (YYYY-MM-DD). */
export function getDayOfWeek(date: string, locale: string): string {
  return new Date(`${date}T00:00`).toLocaleDateString(locale, {
    weekday: 'long',
  });
}

/** Format a Date object as YYYY-MM-DD. */
export function dateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today at midnight. */
export function getDefaultFromDate(): Date {
  return new Date();
}

/** One month from today. */
export function getDefaultUntilDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** The latest allowed "until" date relative to a given "from" date. */
export function getMaxUntilDate(fromDate: Date): Date {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + MAX_MONTHS);
  return d;
}

/** Set a Date to 00:00:00.000. */
export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Set a Date to 23:59:59.999. */
export function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Format "Wed, 10 Jun 2026" from a YYYY-MM-DD string. */
export function formatSessionDate(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00`);
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a Date object as "8 Jun 2026 (Mon)". */
export function formatRangeDate(d: Date, locale: string): string {
  const main = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const dow = d.toLocaleDateString(locale, { weekday: 'short' });
  return `${main} (${dow})`;
}

/** Return "≈ N weeks" between two dates. */
export function approximateWeeks(from: Date, until: Date): string {
  const ms = until.getTime() - from.getTime();
  const weeks = Math.round(ms / (7 * 24 * 60 * 60 * 1000));
  return `≈ ${weeks} week${weeks !== 1 ? 's' : ''}`;
}
