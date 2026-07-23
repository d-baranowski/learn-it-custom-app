import dayjs, {type Dayjs} from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { format, type Locale } from 'date-fns';
import { useDateFnsLocale } from '~/utils/locale';

dayjs.extend(localizedFormat)

const shortDayNames: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getShortDayName(dayNumber: number): string {
  if (dayNumber >= 0 && dayNumber <= 6) {
    return shortDayNames[dayNumber] ?? "???";
  } else {
    return "???";
  }
}

export const bigIntToDate = (timestamp: bigint, offset?: number): Date => {
  return new Date(Number(timestamp) + (offset ?? 0));
}

export const nowBigInt = (): bigint => {
  return BigInt(Date.now());
}

export const midnightToday = (): bigint => {
  const now = nowBigInt();
  const date = bigIntToDate(now);
  date.setHours(0, 0, 0, 0);
  return BigInt(date.getTime());
}

export const midnightTomorrow = (): bigint => {
  const now = nowBigInt();
  const date = bigIntToDate(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return BigInt(date.getTime());

}

export const periodsOverlap = (periodAStart: Dayjs, periodAEnd: Dayjs, periodBStart: Dayjs, periodBEnd: Dayjs): boolean => {
  // (StartA <= EndB) and (EndA >= StartB)

  if ((periodAStart.isBefore(periodBEnd) || periodAStart.isSame(periodBEnd)) &&
    (periodAEnd.isAfter(periodBStart) || periodAEnd.isSame(periodBStart))) {
    return true
  }
  return false
}

// TODO: migrate call sites to usePrettyPrintDate / usePrettyPrintDateTime hooks for locale-aware output
export const prettyPrintDateTime = (timestamp?: bigint) => timestamp ? dayjs(timestampToDate(timestamp)).format('DD/MM/YY HH:mm') : ""

export const prettyPrintDate = (timestamp?: bigint) => timestamp ? dayjs(timestampToDate(timestamp)).format('DD/MM/YY') : ""

export const prettyPrintTime = (timestamp?: bigint) => timestamp ? dayjs(timestampToDate(timestamp)).format('HH:mm') : ""

export function timestampToDate(timestamp: bigint): Date | undefined {
  return new Date(Number(timestamp));
}

// ---------------------------------------------------------------------------
// Locale-aware hook wrappers — use these in React components instead of the
// plain prettyPrint* functions above.
// ---------------------------------------------------------------------------

/** Returns a formatter for bigint ms-timestamps using the active locale's short date. */
export function usePrettyPrintDate(): (timestamp?: bigint) => string {
  const locale = useDateFnsLocale();
  return (timestamp) => {
    if (!timestamp) return '';
    const d = timestampToDate(timestamp);
    if (!d) return '';
    return format(d, 'P', { locale });
  };
}

/** Returns a formatter for bigint ms-timestamps using the active locale's short date + 24 h time. */
export function usePrettyPrintDateTime(): (timestamp?: bigint) => string {
  const locale = useDateFnsLocale();
  return (timestamp) => {
    if (!timestamp) return '';
    const d = timestampToDate(timestamp);
    if (!d) return '';
    return format(d, 'P HH:mm', { locale });
  };
}

// ---------------------------------------------------------------------------
// ISO date-string (YYYY-MM-DD) helpers — used by session date field.
// ---------------------------------------------------------------------------

/** Parses a YYYY-MM-DD string to a local Date at midnight without TZ shift. */
export function parseDateString(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return undefined;
  const [year, month, day] = parts as [number, number, number];
  return new Date(year, month - 1, day);
}

/** Serialises a Date to YYYY-MM-DD using local date components (no TZ shift). */
export function toDateString(d: Date | undefined | null): string | undefined {
  if (!d || isNaN(d.getTime())) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a Date as localized long weekday + day + short month (e.g. Tuesday, 26 May). */
export function formatDateLong(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(d);
}

/** Formats a Date as 24h HH:mm. */
export function formatTimeShort(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** Returns minutes from now to target (rounded up, never negative). */
export function minutesUntil(target: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000));
}

/** Formats a YYYY-MM-DD string using the provided date-fns locale's short date format. */
export function formatDateString(iso: string | undefined, locale: Locale): string {
  const d = parseDateString(iso);
  if (!d) return iso ?? '';
  return format(d, 'P', { locale });
}

/** Returns the browser's IANA timezone string, falling back to Europe/Warsaw. */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Warsaw';
  } catch {
    return 'Europe/Warsaw';
  }
}
